import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerUserSchema, createReceivableSchema, createSecuritySchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Registration route for users who want to complete their profile
  app.post('/api/auth/register', isAuthenticated, async (req: any, res) => {
    try {
      const validation = registerUserSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { role, firstName, lastName, email } = validation.data;
      const userId = req.user.claims.sub;

      // Check if user already has a role assigned
      const existingUser = await storage.getUser(userId);
      if (existingUser && existingUser.role) {
        return res.status(400).json({ message: "User already has a role assigned" });
      }

      // Update user with role and profile information
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: email || req.user.claims.email,
        firstName: firstName || req.user.claims.first_name,
        lastName: lastName || req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Failed to complete registration" });
    }
  });

  // Receivables routes
  app.get('/api/receivables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can access receivables" });
      }

      const receivables = await storage.getReceivablesByMerchant(userId);
      res.json(receivables);
    } catch (error) {
      console.error("Error fetching receivables:", error);
      res.status(500).json({ message: "Failed to fetch receivables" });
    }
  });

  app.post('/api/receivables', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can create receivables" });
      }

      const validation = createReceivableSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { amount, ...rest } = validation.data;
      const receivable = await storage.createReceivable(userId, {
        ...rest,
        amount: amount, // Convert string to decimal
      });

      res.json(receivable);
    } catch (error) {
      console.error("Error creating receivable:", error);
      res.status(500).json({ message: "Failed to create receivable" });
    }
  });

  app.put('/api/receivables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can update receivables" });
      }

      // Check if receivable belongs to the user
      const existingReceivable = await storage.getReceivable(id);
      if (!existingReceivable || existingReceivable.merchantId !== userId) {
        return res.status(404).json({ message: "Receivable not found" });
      }

      const validation = createReceivableSchema.partial().safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { amount, ...rest } = validation.data;
      const updatedData: any = { ...rest };
      if (amount) {
        updatedData.amount = amount; // Convert string to decimal
      }

      const receivable = await storage.updateReceivable(id, updatedData);
      res.json(receivable);
    } catch (error) {
      console.error("Error updating receivable:", error);
      res.status(500).json({ message: "Failed to update receivable" });
    }
  });

  app.delete('/api/receivables/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can delete receivables" });
      }

      // Check if receivable belongs to the user
      const existingReceivable = await storage.getReceivable(id);
      if (!existingReceivable || existingReceivable.merchantId !== userId) {
        return res.status(404).json({ message: "Receivable not found" });
      }

      await storage.deleteReceivable(id);
      res.json({ message: "Receivable deleted successfully" });
    } catch (error) {
      console.error("Error deleting receivable:", error);
      res.status(500).json({ message: "Failed to delete receivable" });
    }
  });

  // Securities routes
  app.post('/api/securities/securitize/:receivableId', isAuthenticated, async (req: any, res) => {
    try {
      const { receivableId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can securitize receivables" });
      }

      // Check if receivable belongs to the user and can be securitized
      const receivable = await storage.getReceivable(receivableId);
      if (!receivable || receivable.merchantId !== userId) {
        return res.status(404).json({ message: "Receivable not found" });
      }

      if (receivable.status !== "draft" && receivable.status !== "active") {
        return res.status(400).json({ message: "Receivable cannot be securitized in its current status" });
      }

      const validation = createSecuritySchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { totalValue, expectedReturn, ...rest } = validation.data;
      
      // Create security
      const security = await storage.createSecurity({
        ...rest,
        receivableId,
        merchantId: userId,
        totalValue: totalValue,
        expectedReturn: expectedReturn || null,
        currency: receivable.currency,
      });

      // Update receivable status
      await storage.updateReceivable(receivableId, { status: "securitized" });

      res.json(security);
    } catch (error) {
      console.error("Error securitizing receivable:", error);
      res.status(500).json({ message: "Failed to securitize receivable" });
    }
  });

  app.get('/api/securities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can access securities" });
      }

      const securities = await storage.getSecuritiesByMerchant(userId);
      res.json(securities);
    } catch (error) {
      console.error("Error fetching securities:", error);
      res.status(500).json({ message: "Failed to fetch securities" });
    }
  });

  app.post('/api/securities/:id/list', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can list securities" });
      }

      // Check if security belongs to the user
      const existingSecurity = await storage.getSecurity(id);
      if (!existingSecurity || existingSecurity.merchantId !== userId) {
        return res.status(404).json({ message: "Security not found" });
      }

      if (existingSecurity.status !== "securitized") {
        return res.status(400).json({ message: "Security must be securitized before listing" });
      }

      const security = await storage.listSecurity(id);
      
      // Update receivable status to listed
      await storage.updateReceivable(existingSecurity.receivableId, { status: "listed" });

      res.json(security);
    } catch (error) {
      console.error("Error listing security:", error);
      res.status(500).json({ message: "Failed to list security" });
    }
  });

  // Public marketplace route for investors
  app.get('/api/marketplace/securities', async (req, res) => {
    try {
      const securities = await storage.getListedSecurities();
      res.json(securities);
    } catch (error) {
      console.error("Error fetching marketplace securities:", error);
      res.status(500).json({ message: "Failed to fetch marketplace securities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
