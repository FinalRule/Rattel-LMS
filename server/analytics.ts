import { db } from "@db";
import { sessions, payments, classes } from "@db/schema";
import { sql } from "drizzle-orm";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getAttendanceStats(month: Date = new Date()) {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  return await db
    .select({
      total: sql<number>`count(*)`,
      present: sql<number>`count(case when student_attendance = 'present' then 1 end)`,
      absent: sql<number>`count(case when student_attendance = 'absent' then 1 end)`,
      date: sessions.dateTime,
    })
    .from(sessions)
    .where(sql`date_time between ${startDate} and ${endDate}`)
    .groupBy(sessions.dateTime);
}

export async function getFinancialStats(month: Date = new Date()) {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  return await db
    .select({
      revenue: sql<number>`sum(case when user_type = 'student' then amount else 0 end)`,
      expenses: sql<number>`sum(case when user_type = 'teacher' then amount else 0 end)`,
      date: payments.paymentDate,
    })
    .from(payments)
    .where(sql`payment_date between ${startDate} and ${endDate}`)
    .groupBy(payments.paymentDate);
}

export async function getClassStats() {
  return await db
    .select({
      totalClasses: sql<number>`count(*)`,
      activeClasses: sql<number>`count(case when status = 'active' then 1 end)`,
      completedClasses: sql<number>`count(case when status = 'completed' then 1 end)`,
    })
    .from(classes);
}

export async function getTeacherPerformance(teacherId: number) {
  return await db
    .select({
      totalSessions: sql<number>`count(*)`,
      onTimeSessions: sql<number>`count(case when teacher_attendance = 'present' then 1 end)`,
      averageRating: sql<number>`avg(student_points)`,
    })
    .from(sessions)
    .innerJoin(classes, sql`${classes.id} = ${sessions.classId}`)
    .where(sql`${classes.teacherId} = ${teacherId}`);
}

export async function getStudentProgress(studentId: number) {
  return await db
    .select({
      totalSessions: sql<number>`count(*)`,
      attendedSessions: sql<number>`count(case when student_attendance = 'present' then 1 end)`,
      averageScore: sql<number>`avg(student_points)`,
    })
    .from(sessions)
    .innerJoin(classes, sql`${classes.id} = ${sessions.classId}`)
    .where(sql`${classes.id} in (select class_id from student_classes where student_id = ${studentId})`);
}
