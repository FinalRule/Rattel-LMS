import { db } from "@db";
import { classes, sessions, users } from "@db/schema";
import { and, eq, gt, lt } from "drizzle-orm";
import { addMinutes, isBefore, isAfter, eachDayOfInterval, isEqual, format, parse } from "date-fns";

interface ScheduleConflict {
  type: 'student' | 'teacher';
  reason: string;
  conflictingSession?: typeof sessions.$inferSelect;
}

export async function generateClassSessions(
  classId: string,
  startDate: Date,
  endDate: Date,
  schedule: {
    days: string[];
    times: { day: string; time: string; }[];
  },
  duration: number
) {
  const sessionList = [];
  const interval = { start: new Date(startDate), end: new Date(endDate) };

  // Get all days in the date range
  const allDays = eachDayOfInterval(interval);

  // For each day, check if it's a scheduled day and create sessions
  for (const day of allDays) {
    const dayName = format(day, 'EEE').toUpperCase();

    // Check if this day is in the schedule
    if (schedule.days.includes(dayName)) {
      // Get all times for this day
      const dayTimes = schedule.times
        .filter(t => t.day === dayName)
        .map(t => t.time);

      // Create a session for each time
      for (const time of dayTimes) {
        const [hours, minutes] = time.split(':').map(Number);
        const sessionDate = new Date(day);
        sessionDate.setHours(hours, minutes, 0, 0);

        // Only create future sessions
        if (isAfter(sessionDate, new Date())) {
          sessionList.push({
            classId,
            dateTime: sessionDate,
            plannedDuration: duration,
            status: "scheduled",
            bufferTimeBefore: 5,
            bufferTimeAfter: 5,
          });
        }
      }
    }
  }

  // Bulk insert all sessions
  if (sessionList.length > 0) {
    await db.insert(sessions).values(sessionList);
  }

  return sessionList;
}

export async function getClassSessions(classId: string) {
  return await db
    .select()
    .from(sessions)
    .where(eq(sessions.classId, classId))
    .orderBy(sessions.dateTime);
}

export async function checkScheduleConflicts(
  teacherId: string,
  studentId: string,
  proposedStart: Date,
  proposedEnd: Date
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = [];

  // Check teacher conflicts
  const teacherSessions = await db
    .select()
    .from(sessions)
    .innerJoin(classes, eq(classes.id, sessions.classId))
    .where(
      and(
        eq(classes.teacherId, teacherId),
        lt(sessions.dateTime, proposedEnd),
        gt(addMinutes(sessions.dateTime, sessions.plannedDuration), proposedStart)
      )
    );

  if (teacherSessions.length > 0) {
    conflicts.push({
      type: 'teacher',
      reason: 'Teacher has another session scheduled',
      conflictingSession: teacherSessions[0]
    });
  }

  // Check student conflicts
  const studentSessions = await db
    .select()
    .from(sessions)
    .innerJoin(classes, eq(classes.id, sessions.classId))
    .where(
      and(
        eq(classes.id, studentId),
        lt(sessions.dateTime, proposedEnd),
        gt(addMinutes(sessions.dateTime, sessions.plannedDuration), proposedStart)
      )
    );

  if (studentSessions.length > 0) {
    conflicts.push({
      type: 'student',
      reason: 'Student has another session scheduled',
      conflictingSession: studentSessions[0]
    });
  }

  return conflicts;
}

export async function scheduleSession(
  classId: string,
  dateTime: Date,
  duration: number
): Promise<typeof sessions.$inferSelect> {
  const [classDetails] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (!classDetails) throw new Error("Class not found");

  const conflicts = await checkScheduleConflicts(
    classDetails.teacherId,
    classId,
    dateTime,
    addMinutes(dateTime, duration)
  );

  if (conflicts.length > 0) {
    throw new Error(`Scheduling conflict: ${conflicts[0].reason}`);
  }

  const [session] = await db
    .insert(sessions)
    .values({
      classId,
      dateTime,
      plannedDuration: duration,
      status: "scheduled",
      bufferTimeBefore: classDetails.bufferTime || 5,
      bufferTimeAfter: classDetails.bufferTime || 5,
    })
    .returning();

  return session;
}

export async function suggestAlternativeSlots(
  teacherId: number,
  studentId: number,
  preferredStart: Date,
  duration: number,
  maxSuggestions: number = 5
): Promise<Date[]> {
  const teacher = await db
    .select()
    .from(users)
    .where(eq(users.id, teacherId))
    .limit(1);

  if (!teacher[0]) throw new Error("Teacher not found");

  const availability = teacher[0].preferences?.availability as {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];

  if (!availability) return [];

  const suggestions: Date[] = [];
  const currentDate = new Date(preferredStart);

  while (suggestions.length < maxSuggestions) {
    const dayAvailability = availability.find(
      a => a.dayOfWeek === currentDate.getDay()
    );

    if (dayAvailability) {
      const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
      const possibleStart = new Date(currentDate);
      possibleStart.setHours(startHour, startMinute, 0);

      const conflicts = await checkScheduleConflicts(
        teacherId,
        studentId,
        possibleStart,
        addMinutes(possibleStart, duration)
      );

      if (conflicts.length === 0) {
        suggestions.push(possibleStart);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return suggestions;
}