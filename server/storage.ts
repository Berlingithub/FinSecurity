import {
  users,
  receivables,
  securities,
  notifications,
  watchlist,
  type User,
  type UpsertUser,
  type RegisterUser,
  type Receivable,
  type InsertReceivable,
  type Security,
  type InsertSecurity,
  type Notification,
  type InsertNotification,
  type WatchlistItem,
  type InsertWatchlistItem,
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
  updateReceivable(id: string, receivable: Partial<Receivable>): Promise<Receivable>;
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
  // Watchlist operations
  addToWatchlist(userId: string, securityId: string): Promise<WatchlistItem>;
  removeFromWatchlist(userId: string, securityId: string): Promise<void>;
  getUserWatchlist(userId: string): Promise<Security[]>;
  clearUserWatchlist(userId: string): Promise<void>;
  purchaseWatchlistItems(userId: string): Promise<Security[]>;
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

  async updateReceivable(id: string, receivableData: Partial<Receivable>): Promise<Receivable> {
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

  async getListedSecurities(): Promise<any[]> {
    return await db
      .select({
        id: securities.id,
        receivableId: securities.receivableId,
        merchantId: securities.merchantId,
        title: securities.title,
        description: securities.description,
        totalValue: securities.totalValue,
        currency: securities.currency,
        expectedReturn: securities.expectedReturn,
        yieldRate: securities.yieldRate,
        riskGrade: securities.riskGrade,
        duration: securities.duration,
        viewCount: securities.viewCount,
        watchlistCount: securities.watchlistCount,
        status: securities.status,
        listedAt: securities.listedAt,
        purchasedBy: securities.purchasedBy,
        purchasedAt: securities.purchasedAt,
        paidAt: securities.paidAt,
        createdAt: securities.createdAt,
        updatedAt: securities.updatedAt,
        // Include receivable details
        debtorName: receivables.debtorName,
        receivableDueDate: receivables.dueDate,
        category: receivables.category,
        riskLevel: receivables.riskLevel,
        // Include merchant details
        merchantName: users.firstName,
        merchantLastName: users.lastName,
      })
      .from(securities)
      .leftJoin(receivables, eq(securities.receivableId, receivables.id))
      .leftJoin(users, eq(securities.merchantId, users.id))
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

  async getSecurity(id: string): Promise<any | undefined> {
    const [result] = await db
      .select({
        id: securities.id,
        receivableId: securities.receivableId,
        merchantId: securities.merchantId,
        title: securities.title,
        description: securities.description,
        totalValue: securities.totalValue,
        currency: securities.currency,
        expectedReturn: securities.expectedReturn,
        yieldRate: securities.yieldRate,
        riskGrade: securities.riskGrade,
        duration: securities.duration,
        viewCount: securities.viewCount,
        watchlistCount: securities.watchlistCount,
        status: securities.status,
        listedAt: securities.listedAt,
        purchasedBy: securities.purchasedBy,
        purchasedAt: securities.purchasedAt,
        paidAt: securities.paidAt,
        createdAt: securities.createdAt,
        updatedAt: securities.updatedAt,
        // Include receivable details
        debtorName: receivables.debtorName,
        receivableDueDate: receivables.dueDate,
        category: receivables.category,
        riskLevel: receivables.riskLevel,
        // Include merchant details
        merchantName: users.firstName,
        merchantLastName: users.lastName,
      })
      .from(securities)
      .leftJoin(receivables, eq(securities.receivableId, receivables.id))
      .leftJoin(users, eq(securities.merchantId, users.id))
      .where(eq(securities.id, id));
    
    return result;
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

  // Watchlist operations
  async addToWatchlist(userId: string, securityId: string): Promise<WatchlistItem> {
    const [item] = await db.insert(watchlist).values({
      userId,
      securityId,
    }).returning();
    return item;
  }

  async removeFromWatchlist(userId: string, securityId: string): Promise<void> {
    await db.delete(watchlist).where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.securityId, securityId)
      )
    );
  }

  async getUserWatchlist(userId: string): Promise<Security[]> {
    const watchlistItems = await db
      .select({
        security: securities,
      })
      .from(watchlist)
      .innerJoin(securities, eq(watchlist.securityId, securities.id))
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(securities.status, "listed")
        )
      )
      .orderBy(desc(watchlist.addedAt));

    return watchlistItems.map(item => item.security);
  }

  async clearUserWatchlist(userId: string): Promise<void> {
    await db.delete(watchlist).where(eq(watchlist.userId, userId));
  }

  async purchaseWatchlistItems(userId: string): Promise<Security[]> {
    // Get all watchlist items for the user
    const watchlistItems = await this.getUserWatchlist(userId);
    
    if (watchlistItems.length === 0) {
      return [];
    }

    const purchasedSecurities: Security[] = [];

    // Purchase each security in the watchlist
    for (const security of watchlistItems) {
      const [updatedSecurity] = await db
        .update(securities)
        .set({
          status: "purchased",
          purchasedBy: userId,
          purchasedAt: new Date(),
        })
        .where(
          and(
            eq(securities.id, security.id),
            eq(securities.status, "listed")
          )
        )
        .returning();

      if (updatedSecurity) {
        purchasedSecurities.push(updatedSecurity);
        
        // Update related receivable status
        await db
          .update(receivables)
          .set({ status: "sold" })
          .where(eq(receivables.id, updatedSecurity.receivableId));
      }
    }

    // Clear the watchlist after successful purchases
    await this.clearUserWatchlist(userId);

    return purchasedSecurities;
  }
}

export const storage = new DatabaseStorage();
