import {
  users,
  receivables,
  type User,
  type UpsertUser,
  type RegisterUser,
  type Receivable,
  type InsertReceivable,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
