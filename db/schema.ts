import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Enum types
export const userRoles = ["admin", "teacher", "student"] as const;
export const classStatuses = ["active", "paused", "completed", "cancelled"] as const;
export const sessionStatuses = ["scheduled", "in_progress", "completed", "cancelled", "rescheduled"] as const;
export const attendanceStatuses = ["present", "absent", "late"] as const;
export const paymentStatuses = ["pending", "completed", "failed", "refunded"] as const;
export const paymentTypes = ["student_payment", "teacher_payout"] as const;

// Base users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoles }).notNull(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  timezone: text("timezone").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});

// Teachers extension
export const teachers = pgTable("teachers", {
  userId: uuid("user_id").references(() => users.id).primaryKey(),
  bio: text("bio"),
  cvFileUrl: text("cv_file_url"),
  residenceCity: text("residence_city"),
  paymentMethod: jsonb("payment_method"),
  baseSalaryPerHour: decimal("base_salary_per_hour", { precision: 10, scale: 2 }),
  googleAccount: text("google_account"),
  availabilitySchedule: jsonb("availability_schedule"),
  bufferTimePreference: integer("buffer_time_preference"),
  notes: text("notes"),
  rating: decimal("rating", { precision: 3, scale: 2 })
});

// Students extension
export const students = pgTable("students", {
  userId: uuid("user_id").references(() => users.id).primaryKey(),
  nationality: text("nationality").notNull(),
  countryOfResidence: text("country_of_residence").notNull(),
  parentName: text("parent_name"),
  paymentMethod: jsonb("payment_method"),
  learningGoals: text("learning_goals"),
  preferredSessionDays: text("preferred_session_days").array(),
  notes: text("notes"),
  emergencyContact: jsonb("emergency_contact")
});

// Subjects
export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  details: text("details"),
  category: text("category"),
  difficultyLevel: text("difficulty_level"),
  availableDurations: integer("available_durations").array(),
  sessionsPerMonth: integer("sessions_per_month").array(),
  defaultBufferTime: integer("default_buffer_time"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Price Plans
export const pricePlans = pgTable("price_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").references(() => subjects.id),
  name: text("name").notNull(),
  durationPerSession: integer("duration_per_session").notNull(),
  sessionsPerMonth: integer("sessions_per_month").notNull(),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  promotionalPrice: decimal("promotional_price", { precision: 10, scale: 2 }),
  promotionValidUntil: timestamp("promotion_valid_until", { withTimezone: true }),
  minimumCommitment: integer("minimum_commitment"),
  isTrialEligible: boolean("is_trial_eligible").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Classes
export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").references(() => subjects.id),
  teacherId: uuid("teacher_id").references(() => teachers.userId),
  pricePlanId: uuid("price_plan_id").references(() => pricePlans.id),
  name: text("name"),
  startDate: date("start_date").notNull(),
  defaultDuration: integer("default_duration").notNull(),
  schedule: jsonb("schedule").notNull(),
  bufferTime: integer("buffer_time"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  teacherHourlyRate: decimal("teacher_hourly_rate", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: classStatuses }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// Class Enrollments
export const classEnrollments = pgTable("class_enrollments", {
  classId: uuid("class_id").references(() => classes.id),
  studentId: uuid("student_id").references(() => students.userId),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true })
}, (table) => ({
  pk: primaryKey(table.classId, table.studentId)
}));

// Sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id").references(() => classes.id),
  sessionNumber: integer("session_number").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  plannedDuration: integer("planned_duration").notNull(),
  actualDuration: integer("actual_duration"),
  googleMeetLink: text("google_meet_link"),
  bufferTimeBefore: integer("buffer_time_before"),
  bufferTimeAfter: integer("buffer_time_after"),
  status: text("status", { enum: sessionStatuses }).default("scheduled"),
  rescheduledFrom: uuid("rescheduled_from").references(() => sessions.id),
  cancellationReason: text("cancellation_reason"),
  recordingUrl: text("recording_url"),
  teacherNotes: text("teacher_notes"),
  studentNotes: text("student_notes"),
  studentPoints: integer("student_points"),
  isMakeupSession: boolean("is_makeup_session").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

// Session Attendance
export const sessionAttendance = pgTable("session_attendance", {
  sessionId: uuid("session_id").references(() => sessions.id),
  userId: uuid("user_id").references(() => users.id),
  status: text("status", { enum: attendanceStatuses }).notNull(),
  joinTime: timestamp("join_time", { withTimezone: true }),
  leaveTime: timestamp("leave_time", { withTimezone: true })
}, (table) => ({
  pk: primaryKey(table.sessionId, table.userId)
}));

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  paymentType: text("payment_type", { enum: paymentTypes }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  status: text("status", { enum: paymentStatuses }).default("pending"),
  paymentMethod: jsonb("payment_method"),
  transactionReference: text("transaction_reference"),
  invoiceNumber: text("invoice_number"),
  month: integer("month"),
  year: integer("year"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true })
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessionAttendance),
  payments: many(payments)
}));

export const teacherRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id]
  }),
  subjects: many(teacherSubjects),
  classes: many(classes)
}));

export const studentRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id]
  }),
  enrollments: many(classEnrollments),
  attendance: many(sessionAttendance, {
    fields: [students.userId],
    references: [sessionAttendance.userId]
  })
}));

export const subjectRelations = relations(subjects, ({ many }) => ({
  teachers: many(teacherSubjects),
  classes: many(classes),
  pricePlans: many(pricePlans)
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [classes.subjectId],
    references: [subjects.id]
  }),
  teacher: one(teachers, {
    fields: [classes.teacherId],
    references: [teachers.userId]
  }),
  pricePlan: one(pricePlans, {
    fields: [classes.pricePlanId],
    references: [pricePlans.id]
  }),
  students: many(classEnrollments),
  sessions: many(sessions)
}));


// Teacher-Subject relationship
export const teacherSubjects = pgTable("teacher_subjects", {
  teacherId: uuid("teacher_id").references(() => teachers.userId),
  subjectId: uuid("subject_id").references(() => subjects.id)
}, (table) => ({
  pk: primaryKey(table.teacherId, table.subjectId)
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;


// Extended types with relations
export type SelectTeacher = Teacher & {
  user: User;
};

export type SelectStudent = Student & {
  user: User;
};

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertTeacherSchema = createInsertSchema(teachers);
export const selectTeacherSchema = createSelectSchema(teachers);

export const insertStudentSchema = createInsertSchema(students);
export const selectStudentSchema = createSelectSchema(students);

export const insertSubjectSchema = createInsertSchema(subjects);
export const selectSubjectSchema = createSelectSchema(subjects);

export const insertClassSchema = createInsertSchema(classes);
export const selectClassSchema = createSelectSchema(classes);

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

// Add TeacherWithUser schema
export const selectTeacherWithUserSchema = createSelectSchema(teachers).extend({
  user: selectUserSchema
});

// Add StudentWithUser schema
export const selectStudentWithUserSchema = createSelectSchema(students).extend({
  user: selectUserSchema
});