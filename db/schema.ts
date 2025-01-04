import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  decimal, 
  json, 
  date,
  time 
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique().notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  timezone: text("timezone").notNull(),
  bio: text("bio"),
  dateOfBirth: date("date_of_birth"),
  active: boolean("active").default(true),
  preferences: json("preferences"),
  createdAt: timestamp("created_at").defaultNow()
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  details: text("details"),
  category: text("category"),
  difficultyLevel: text("difficulty_level"),
  availableDurations: json("available_durations"),
  sessionsPerMonth: integer("sessions_per_month"),
  prerequisites: json("prerequisites"),
  defaultBufferTime: integer("default_buffer_time"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  startDate: date("start_date").notNull(),
  defaultDuration: integer("default_duration").notNull(),
  weekDays: json("week_days"),
  schedule: json("schedule"),
  bufferTime: integer("buffer_time"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  currency: text("currency"),
  teacherSalaryRate: decimal("teacher_salary_rate", { precision: 10, scale: 2 }),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow()
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  dateTime: timestamp("date_time").notNull(),
  googleMeetLink: text("google_meet_link"),
  studentAttendance: text("student_attendance"),
  teacherAttendance: text("teacher_attendance"),
  plannedDuration: integer("planned_duration"),
  actualDuration: integer("actual_duration"),
  bufferTimeBefore: integer("buffer_time_before"),
  bufferTimeAfter: integer("buffer_time_after"),
  status: text("status"),
  teacherNotes: text("teacher_notes"),
  studentNotes: text("student_notes"),
  studentPoints: integer("student_points"),
  makeupSession: boolean("makeup_session").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  sharedWith: json("shared_with"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow()
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userType: text("user_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  status: text("status").notNull(),
  paymentMethod: text("payment_method"),
  reference: text("reference"),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  teachingClasses: many(classes, { relationName: "teacher" }),
  ownedResources: many(resources)
}));

export const subjectRelations = relations(subjects, ({ many }) => ({
  classes: many(classes)
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [classes.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  sessions: many(sessions)
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertSubjectSchema = createInsertSchema(subjects);
export const selectSubjectSchema = createSelectSchema(subjects);

export const insertClassSchema = createInsertSchema(classes);
export const selectClassSchema = createSelectSchema(classes);

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export const insertResourceSchema = createInsertSchema(resources);
export const selectResourceSchema = createSelectSchema(resources);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
