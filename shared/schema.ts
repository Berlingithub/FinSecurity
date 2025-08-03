import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["merchant", "investor"] }).notNull(),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0.00"),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = insertUserSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phoneNumber: true,
  address: true,
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["security_purchased", "security_listed", "payment_received", "payment_due"] }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data like security ID, amount, etc.
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Receivables table
export const receivables = pgTable("receivables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => users.id),
  debtorName: varchar("debtor_name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  dueDate: date("due_date").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["draft", "active", "securitized", "listed", "sold", "paid", "overdue"] }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Securities table - represents securitized receivables
export const securities = pgTable("securities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receivableId: varchar("receivable_id").notNull().references(() => receivables.id),
  merchantId: varchar("merchant_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }), // percentage
  riskGrade: varchar("risk_grade", { enum: ["A", "A-", "B+", "B", "B-", "C+", "C", "C-"] }),
  duration: varchar("duration").notNull(), // e.g., "90 days", "6 months"
  status: varchar("status", { enum: ["draft", "securitized", "listed", "purchased", "payment_due", "paid", "cancelled"] }).notNull().default("draft"),
  listedAt: timestamp("listed_at"),
  purchasedBy: varchar("purchased_by").references(() => users.id),
  purchasedAt: timestamp("purchased_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  receivables: many(receivables),
  securities: many(securities),
  purchasedSecurities: many(securities, { relationName: "purchased" }),
}));

export const receivablesRelations = relations(receivables, ({ one, many }) => ({
  merchant: one(users, {
    fields: [receivables.merchantId],
    references: [users.id],
  }),
  securities: many(securities),
}));

export const securitiesRelations = relations(securities, ({ one }) => ({
  receivable: one(receivables, {
    fields: [securities.receivableId],
    references: [receivables.id],
  }),
  merchant: one(users, {
    fields: [securities.merchantId],
    references: [users.id],
  }),
  purchaser: one(users, {
    fields: [securities.purchasedBy],
    references: [users.id],
  }),
}));

// Schemas
export const insertReceivableSchema = createInsertSchema(receivables).omit({
  id: true,
  merchantId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const createReceivableSchema = insertReceivableSchema.extend({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number with up to 2 decimal places"),
});

export const insertSecuritySchema = createInsertSchema(securities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  listedAt: true,
});

export const createSecuritySchema = insertSecuritySchema.extend({
  totalValue: z.string().regex(/^\d+(\.\d{1,2})?$/, "Total value must be a valid number with up to 2 decimal places"),
  expectedReturn: z.string().regex(/^\d+(\.\d{1,2})?$/, "Expected return must be a valid percentage").optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type Receivable = typeof receivables.$inferSelect;
export type InsertReceivable = z.infer<typeof insertReceivableSchema>;
export type CreateReceivable = z.infer<typeof createReceivableSchema>;
export type Security = typeof securities.$inferSelect;
export type InsertSecurity = z.infer<typeof insertSecuritySchema>;
export type CreateSecurity = z.infer<typeof createSecuritySchema>;
