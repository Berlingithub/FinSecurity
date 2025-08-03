import {
  users,
  receivables,
  securities,
  notifications,
  type User,
  type UpsertUser,
  type RegisterUser,
  type Receivable,
  type InsertReceivable,
  type Security,
  type InsertSecurity,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Registration operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  // Receivable operations
  createReceivable(merchantId: string, receivable: InsertReceivable): Promise<Receivable>;
  getReceivablesByMerchant(merchantId: string): Promise<Receivable[]>;
  getReceivable(id: string): Promise<Receivable | undefined>;
  updateReceivable(id: string, receivable: Partial<InsertReceivable>): Promise<Receivable>;
  deleteReceivable(id: string): Promise<void>;
  // Security operations
  createSecurity(security: InsertSecurity): Promise<Security>;
  getSecuritiesByMerchant(merchantId: string): Promise<Security[]>;
  getListedSecurities(): Promise<Security[]>;
  getSecurity(id: string): Promise<Security | undefined>;
  updateSecurity(id: string, security: Partial<InsertSecurity>): Promise<Security>;
  listSecurity(id: string): Promise<Security>;
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Receivable operations
  async createReceivable(merchantId: string, receivableData: InsertReceivable): Promise<Receivable> {
    const [receivable] = await db
      .insert(receivables)
      .values({
        ...receivableData,
        merchantId,
      })
      .returning();
    return receivable;
  }

  async getReceivablesByMerchant(merchantId: string): Promise<Receivable[]> {
    return await db
      .select()
      .from(receivables)
      .where(eq(receivables.merchantId, merchantId))
      .orderBy(desc(receivables.createdAt));
  }

  async getReceivable(id: string): Promise<Receivable | undefined> {
    const [receivable] = await db
      .select()
      .from(receivables)
      .where(eq(receivables.id, id));
    return receivable;
  }

  async updateReceivable(id: string, receivableData: Partial<InsertReceivable>): Promise<Receivable> {
    const [receivable] = await db
      .update(receivables)
      .set({
        ...receivableData,
        updatedAt: new Date(),
      })
      .where(eq(receivables.id, id))
      .returning();
    return receivable;
  }

  async deleteReceivable(id: string): Promise<void> {
    await db
      .delete(receivables)
      .where(eq(receivables.id, id));
  }

  // Security operations
  async createSecurity(securityData: InsertSecurity): Promise<Security> {
    const [security] = await db
      .insert(securities)
      .values(securityData)
      .returning();
    return security;
  }

  async getSecuritiesByMerchant(merchantId: string): Promise<Security[]> {
    return await db
      .select()
      .from(securities)
      .where(eq(securities.merchantId, merchantId))
      .orderBy(desc(securities.createdAt));
  }

  async getListedSecurities(): Promise<Security[]> {
    return await db
      .select()
      .from(securities)
      .where(eq(securities.status, "listed"))
      .orderBy(desc(securities.listedAt));
  }

  async getPurchasedSecurities(investorId: string): Promise<Security[]> {
    return await db
      .select()
      .from(securities)
      .where(eq(securities.purchasedBy, investorId))
      .orderBy(desc(securities.purchasedAt));
  }

  async purchaseSecurity(securityId: string, investorId: string): Promise<Security> {
    const [security] = await db
      .update(securities)
      .set({
        status: "purchased",
        purchasedBy: investorId,
        purchasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(securities.id, securityId), eq(securities.status, "listed")))
      .returning();
    
    if (!security) {
      throw new Error("Security not found or already purchased");
    }
    
    return security;
  }

  async getSecurity(id: string): Promise<Security | undefined> {
    const [security] = await db
      .select()
      .from(securities)
      .where(eq(securities.id, id));
    return security;
  }

  async updateSecurity(id: string, securityData: Partial<InsertSecurity>): Promise<Security> {
    const [security] = await db
      .update(securities)
      .set({
        ...securityData,
        updatedAt: new Date(),
      })
      .where(eq(securities.id, id))
      .returning();
    return security;
  }

  async listSecurity(id: string): Promise<Security> {
    const [security] = await db
      .update(securities)
      .set({
        status: "listed",
        listedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(securities.id, id))
      .returning();
    return security;
  }

  // Security payment methods
  async markSecurityAsPaid(securityId: string): Promise<Security> {
    const [security] = await db
      .update(securities)
      .set({ 
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(securities.id, securityId))
      .returning();
    return security;
  }

  async updateUserWalletBalance(userId: string, amount: number): Promise<User> {
    // Get current balance
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    const currentBalance = parseFloat(currentUser.walletBalance || "0");
    const newBalance = currentBalance + amount;

    const [user] = await db
      .update(users)
      .set({ 
        walletBalance: newBalance.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Profile management methods
  async updateUserProfile(userId: string, profileData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return createdNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async clearAllNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
