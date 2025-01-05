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
} from "@db/schema";
import { eq, count } from "drizzle-orm";
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
      return res.status(401).send("Not authenticated");
    }
    if (req.user.role !== "admin") {
      return res.status(403).send("Not authorized");
    }
    next();
  };

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
    const allClasses = await db.select().from(classes);
    res.json(allClasses);
  });

  app.post("/api/classes", async (req, res) => {
    const newClass = await db.insert(classes).values(req.body).returning();
    res.json(newClass[0]);
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

  const httpServer = createServer(app);
  return httpServer;
}