import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  users,
  subjects,
  classes,
  sessions,
  payments,
  sessionAttendance,
} from "@db/schema";
import { eq, count } from "drizzle-orm";

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