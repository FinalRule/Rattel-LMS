import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  users,
  teachers,
  subjects,
  classes,
  sessions,
  payments,
  sessionAttendance,
  insertUserSchema,
  insertTeacherSchema,
  students,
  classEnrollments,
  pricePlans,
} from "@db/schema";
import { eq, count, sql, and, desc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
};

export function registerRoutes(app: Express): Server {
  // Auth routes
  setupAuth(app);

  // Middleware to check if user is authenticated and is admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    if (req.user.role !== "admin") {
      return res.status(403).send("Admin privileges required");
    }
    next();
  };

  // Price Plans
  app.get("/api/price-plans", async (req, res) => {
    try {
      const allPricePlans = await db.query.pricePlans.findMany({
        with: {
          subject: true,
        },
      });
      res.json(allPricePlans);
    } catch (error: any) {
      console.error("Error fetching price plans:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/price-plans", requireAdmin, async (req, res) => {
    try {
      const [pricePlan] = await db
        .insert(pricePlans)
        .values({
          name: req.body.name,
          subjectId: req.body.subjectId,
          durationPerSession: req.body.durationPerSession,
          sessionsPerMonth: req.body.sessionsPerMonth,
          monthlyFee: req.body.monthlyFee,
          currency: req.body.currency,
          promotionalPrice: req.body.promotionalPrice,
          promotionValidUntil: req.body.promotionValidUntil ? new Date(req.body.promotionValidUntil) : null,
          minimumCommitment: req.body.minimumCommitment,
          isTrialEligible: req.body.isTrialEligible,
          isActive: true,
        })
        .returning();

      res.json(pricePlan);
    } catch (error: any) {
      console.error("Error creating price plan:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Teachers
  app.get("/api/teachers", async (req, res) => {
    try {
      const allTeachers = await db.query.teachers.findMany({
        with: {
          user: true,
        },
      });
      res.json(allTeachers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/teachers", requireAdmin, async (req, res) => {
    try {
      const {
        email,
        password,
        fullName,
        phone,
        whatsapp,
        timezone,
        bio,
        residenceCity,
        googleAccount,
        availabilitySchedule,
        bufferTimePreference,
        baseSalaryPerHour,
        notes
      } = req.body;

      // Validate user input
      const userResult = insertUserSchema.safeParse({
        email,
        password,
        fullName,
        phone,
        whatsapp,
        timezone,
        role: "teacher",
      });

      if (!userResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: userResult.error.issues
        });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create user and teacher in a transaction
      const [teacher] = await db.transaction(async (tx) => {
        // Create user first
        const [newUser] = await tx
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            fullName,
            phone,
            whatsapp,
            timezone,
            role: "teacher",
          })
          .returning();

        // Create teacher profile
        const [newTeacher] = await tx
          .insert(teachers)
          .values({
            userId: newUser.id,
            bio,
            residenceCity,
            googleAccount,
            availabilitySchedule,
            bufferTimePreference,
            baseSalaryPerHour,
            notes,
          })
          .returning();

        return [{ ...newTeacher, user: newUser }];
      });

      res.json(teacher);
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Subjects
  app.get("/api/subjects", async (req, res) => {
    const allSubjects = await db.select().from(subjects);
    res.json(allSubjects);
  });

  app.post("/api/subjects", requireAdmin, async (req, res) => {
    try {
      const subject = await db.insert(subjects).values({
        ...req.body,
        isActive: true,
      }).returning();
      res.json(subject[0]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const [subject] = await db
        .update(subjects)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(subjects.id, req.params.id))
        .returning();

      if (!subject) {
        return res.status(404).send("Subject not found");
      }

      res.json(subject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const [subject] = await db
        .update(subjects)
        .set({ isActive: false })
        .where(eq(subjects.id, req.params.id))
        .returning();

      if (!subject) {
        return res.status(404).send("Subject not found");
      }

      res.json({ message: "Subject deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Classes
  app.get("/api/classes", async (req, res) => {
    try {
      const allClasses = await db.query.classes.findMany({
        with: {
          teacher: {
            with: {
              user: true,
            }
          },
          pricePlan: {
            with: {
              subject: true,
            }
          },
        },
      });
      res.json(allClasses);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/classes", requireAdmin, async (req, res) => {
    try {
      const { name, teacherId, pricePlanId, startDate, endDate, maxStudents, notes } = req.body;

      // Validate required fields
      if (!name || !teacherId || !pricePlanId) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Name, teacher, and price plan are required"
        });
      }

      // Validate if teacher exists
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, teacherId),
      });

      if (!teacher) {
        return res.status(400).json({ error: "Teacher not found" });
      }

      // Validate if price plan exists
      const pricePlan = await db.query.pricePlans.findFirst({
        where: eq(pricePlans.id, pricePlanId),
      });

      if (!pricePlan) {
        return res.status(400).json({ error: "Price plan not found" });
      }

      // Create the class
      const [newClass] = await db
        .insert(classes)
        .values({
          name,
          teacherId,
          pricePlanId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          maxStudents,
          notes,
          status: "active",
        })
        .returning();

      // Fetch the created class with related data
      const classWithRelations = await db.query.classes.findFirst({
        where: eq(classes.id, newClass.id),
        with: {
          teacher: {
            with: {
              user: true,
            }
          },
          pricePlan: {
            with: {
              subject: true,
            }
          },
        },
      });

      res.json(classWithRelations);
    } catch (error: any) {
      console.error("Error creating class:", error);
      res.status(400).json({ error: error.message });
    }
  });


  // Sessions
  app.get("/api/sessions", async (req, res) => {
    const allSessions = await db.select().from(sessions);
    res.json(allSessions);
  });

  app.post("/api/sessions", async (req, res) => {
    const session = await db.insert(sessions).values(req.body).returning();
    res.json(session[0]);
  });

  // Session Attendance
  app.patch("/api/sessions/:id/attendance", async (req, res) => {
    const { id } = req.params;
    const { userId, status, joinTime, leaveTime } = req.body;

    const attendance = await db
      .insert(sessionAttendance)
      .values({
        sessionId: id,
        userId,
        status,
        joinTime,
        leaveTime
      })
      .onConflictDoUpdate({
        target: [sessionAttendance.sessionId, sessionAttendance.userId],
        set: { status, joinTime, leaveTime }
      })
      .returning();

    res.json(attendance[0]);
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    const allPayments = await db.select().from(payments);
    res.json(allPayments);
  });

  app.post("/api/payments", async (req, res) => {
    const payment = await db.insert(payments).values(req.body).returning();
    res.json(payment[0]);
  });

  // Analytics endpoints
  app.get("/api/analytics/attendance", async (req, res) => {
    const attendanceStats = await db
      .select({
        sessionId: sessionAttendance.sessionId,
        status: sessionAttendance.status,
        totalStudents: count(sessionAttendance.userId)
      })
      .from(sessionAttendance)
      .groupBy(sessionAttendance.sessionId, sessionAttendance.status);

    res.json(attendanceStats);
  });

  app.get("/api/analytics/financial", async (req, res) => {
    const financialStats = await db
      .select({
        totalAmount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        type: payments.paymentType
      })
      .from(payments);

    res.json(financialStats);
  });

  // Students
  app.get("/api/students", async (req, res) => {
    try {
      const allStudents = await db.query.students.findMany({
        with: {
          user: true,
        },
      });
      res.json(allStudents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const {
        email,
        password,
        fullName,
        phone,
        whatsapp,
        timezone,
        nationality,
        countryOfResidence,
        parentName,
        learningGoals,
        notes,
      } = req.body;

      // Validate user input
      const userResult = insertUserSchema.safeParse({
        email,
        password,
        fullName,
        phone,
        whatsapp,
        timezone,
        role: "student",
      });

      if (!userResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: userResult.error.issues,
        });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create user and student in a transaction
      const [student] = await db.transaction(async (tx) => {
        // Create user first
        const [newUser] = await tx
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            fullName,
            phone,
            whatsapp,
            timezone,
            role: "student",
          })
          .returning();

        // Create student profile
        const [newStudent] = await tx
          .insert(students)
          .values({
            userId: newUser.id,
            nationality,
            countryOfResidence,
            parentName,
            learningGoals,
            notes,
          })
          .returning();

        return [{ ...newStudent, user: newUser }];
      });

      res.json(student);
    } catch (error: any) {
      console.error("Error creating student:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Student Stats
  app.get("/api/students/:id/stats", requireAdmin, async (req, res) => {
    try {
      const studentId = req.params.id;

      // Get class enrollments
      const enrollments = await db
        .select({
          classId: classEnrollments.classId,
        })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, studentId));

      const classIds = enrollments.map(e => e.classId);

      // Get sessions for these classes
      const studentSessions = await db
        .select()
        .from(sessions)
        .where(
          sql`${sessions.classId} IN ${classIds}`
        );

      // Calculate stats
      const totalClasses = classIds.length;
      const activeClasses = (await db
        .select()
        .from(classes)
        .where(
          and(
            sql`${classes.id} IN ${classIds}`,
            eq(classes.status, "active")
          )
        )).length;

      // Get attendance records
      const attendance = await db
        .select()
        .from(sessionAttendance)
        .where(eq(sessionAttendance.userId, studentId));

      const attendanceRate = attendance.length > 0
        ? (attendance.filter(a => a.status === "present").length / attendance.length) * 100
        : 0;

      const totalLearningHours = studentSessions.reduce(
        (sum, session) => sum + (session.actualDuration || session.plannedDuration),
        0
      ) / 60;

      const averagePerformance = studentSessions.reduce(
        (sum, session) => sum + (session.studentPoints || 0),
        0
      ) / (studentSessions.length || 1);

      res.json({
        totalClasses,
        activeClasses,
        averageAttendance: Math.round(attendanceRate),
        totalLearningHours: Math.round(totalLearningHours),
        averagePerformance: Math.round(averagePerformance * 10) / 10,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Student Financials
  app.get("/api/students/:id/financials", requireAdmin, async (req, res) => {
    try {
      const studentId = req.params.id;
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get current month payments
      const currentMonthPayments = await db
        .select({
          amount: sql<number>`SUM(${payments.amount})`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.userId, studentId),
            eq(payments.month, currentMonth),
            eq(payments.year, currentYear),
            eq(payments.status, "completed")
          )
        );

      // Get outstanding balance (pending payments)
      const outstandingBalance = await db
        .select({
          amount: sql<number>`SUM(${payments.amount})`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.userId, studentId),
            eq(payments.status, "pending")
          )
        );

      // Get last completed payment
      const [lastPayment] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.userId, studentId),
            eq(payments.status, "completed")
          )
        )
        .orderBy(desc(payments.completedAt))
        .limit(1);

      res.json({
        currentMonthPayments: currentMonthPayments[0]?.amount || 0,
        outstandingBalance: outstandingBalance[0]?.amount || 0,
        lastPayment: lastPayment
          ? {
              amount: lastPayment.amount,
              date: lastPayment.completedAt,
            }
          : null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}