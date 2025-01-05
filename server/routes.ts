import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, crypto } from "./auth";
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
  students,
  classEnrollments,
  pricePlans,
} from "@db/schema";
import { eq, count, sql, and, desc } from "drizzle-orm";

// Authentication middleware with improved error handling
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Please log in to access this resource"
    });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      error: "Access denied",
      message: "This action requires administrator privileges"
    });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  // Set up authentication routes first
  setupAuth(app);

  // Add auth middleware for all /api routes except auth routes
  app.use("/api/*", (req, res, next) => {
    if (
      req.path === "/api/login" ||
      req.path === "/api/register" ||
      req.path === "/api/user"
    ) {
      return next();
    }

    requireAuth(req, res, next);
  });

  // Price Plans routes - all require authentication
  app.get("/api/price-plans", requireAuth, async (req, res) => {
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

  // Teachers routes - all require authentication
  app.get("/api/teachers", requireAuth, async (req, res) => {
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

  // Classes routes - all require authentication
  app.get("/api/classes", requireAuth, async (req, res) => {
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

  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      const {
        name,
        teacherId,
        pricePlanId,
        startDate,
        defaultDuration,
        schedule,
        monthlyPrice,
        currency,
        teacherHourlyRate,
        bufferTime,
        selectedStudentIds
      } = req.body;

      // Create the class
      const [newClass] = await db.transaction(async (tx) => {
        // Create the class first
        const [createdClass] = await tx
          .insert(classes)
          .values({
            name,
            teacherId,
            pricePlanId,
            startDate: new Date(startDate),
            defaultDuration,
            schedule,
            monthlyPrice: monthlyPrice.toString(),
            currency,
            teacherHourlyRate: teacherHourlyRate.toString(),
            bufferTime,
            status: "active",
          })
          .returning();

        // If students are selected, create enrollments
        if (selectedStudentIds?.length > 0) {
          await tx
            .insert(classEnrollments)
            .values(
              selectedStudentIds.map((studentId: string) => ({
                classId: createdClass.id,
                studentId,
                joinedAt: new Date(),
              }))
            );
        }

        return [createdClass];
      });

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

  // Add this route after the existing POST /api/classes route
  app.post("/api/price-plans", requireAuth, async (req, res) => {
    try {
      const {
        name,
        subjectId,
        description,
        monthlyPrice,
        currency,
        features,
        isActive
      } = req.body;

      // Create the price plan
      const [newPlan] = await db
        .insert(pricePlans)
        .values({
          name,
          subjectId,
          description,
          monthlyPrice: monthlyPrice.toString(),
          currency,
          features,
          isActive: isActive ?? true,
        })
        .returning();

      // Fetch the created plan with related data
      const planWithRelations = await db.query.pricePlans.findFirst({
        where: eq(pricePlans.id, newPlan.id),
        with: {
          subject: true,
        },
      });

      res.json(planWithRelations);
    } catch (error: any) {
      console.error("Error creating price plan:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const classId = req.params.id;
      const {
        name,
        teacherId,
        pricePlanId,
        startDate,
        defaultDuration,
        schedule,
        monthlyPrice,
        currency,
        teacherHourlyRate,
        bufferTime,
      } = req.body;

      const [updatedClass] = await db
        .update(classes)
        .set({
          name,
          teacherId,
          pricePlanId,
          startDate: startDate,
          defaultDuration,
          schedule,
          monthlyPrice: monthlyPrice.toString(),
          currency,
          teacherHourlyRate: teacherHourlyRate.toString(),
          bufferTime,
          updatedAt: new Date(),
        })
        .where(eq(classes.id, classId))
        .returning();

      if (!updatedClass) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Fetch the updated class with related data
      const classWithRelations = await db.query.classes.findFirst({
        where: eq(classes.id, updatedClass.id),
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
      console.error("Error updating class:", error);
      res.status(400).json({ error: error.message });
    }
  });

  //Subjects routes - all require authentication
  app.get("/api/subjects", requireAuth, async (req, res) => {
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

  // Sessions - require auth for all operations
  app.get("/api/sessions", requireAuth, async (req, res) => {
    const allSessions = await db.select().from(sessions);
    res.json(allSessions);
  });

  app.post("/api/sessions", requireAuth, async (req, res) => {
    const session = await db.insert(sessions).values(req.body).returning();
    res.json(session[0]);
  });

  // Session Attendance - require auth for all operations
  app.patch("/api/sessions/:id/attendance", requireAuth, async (req, res) => {
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

  // Payments - require auth for all operations
  app.get("/api/payments", requireAuth, async (req, res) => {
    const allPayments = await db.select().from(payments);
    res.json(allPayments);
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    const payment = await db.insert(payments).values(req.body).returning();
    res.json(payment[0]);
  });

  // Analytics endpoints - require auth for all operations
  app.get("/api/analytics/attendance", requireAuth, async (req, res) => {
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

  app.get("/api/analytics/financial", requireAuth, async (req, res) => {
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

  // Students - require auth for all operations
  app.get("/api/students", requireAuth, async (req, res) => {
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

      // Create user and student in a transaction
      const [student] = await db.transaction(async (tx) => {
        // Hash the password before creating the user
        const hashedPassword = await crypto.hash(password);

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

  // Student Stats - require auth for all operations
  app.get("/api/students/:id/stats", requireAuth, async (req, res) => {
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

  // Student Financials - require auth for all operations
  app.get("/api/students/:id/financials", requireAuth, async (req, res) => {
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}