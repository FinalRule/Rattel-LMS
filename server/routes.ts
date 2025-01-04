import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  users,
  subjects,
  classes,
  sessions,
  resources,
  payments,
} from "@db/schema";
import { eq, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Auth routes
  setupAuth(app);

  // Subjects
  app.get("/api/subjects", async (req, res) => {
    const allSubjects = await db.select().from(subjects);
    res.json(allSubjects);
  });

  app.post("/api/subjects", async (req, res) => {
    const subject = await db.insert(subjects).values(req.body).returning();
    res.json(subject[0]);
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

  app.patch("/api/sessions/:id/attendance", async (req, res) => {
    const { id } = req.params;
    const { studentAttendance, teacherAttendance } = req.body;
    
    const updated = await db
      .update(sessions)
      .set({ studentAttendance, teacherAttendance })
      .where(eq(sessions.id, parseInt(id)))
      .returning();
      
    res.json(updated[0]);
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    const allResources = await db.select().from(resources);
    res.json(allResources);
  });

  app.post("/api/resources", async (req, res) => {
    const resource = await db.insert(resources).values(req.body).returning();
    res.json(resource[0]);
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
        total: sessions.id,
        present: sessions.studentAttendance,
        absent: sessions.studentAttendance,
      })
      .from(sessions);

    res.json(attendanceStats);
  });

  app.get("/api/analytics/financial", async (req, res) => {
    const financialStats = await db
      .select({
        totalAmount: payments.amount,
        currency: payments.currency,
        status: payments.status,
      })
      .from(payments);

    res.json(financialStats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
