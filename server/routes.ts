import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  registerUserSchema, 
  createReceivableSchema, 
  createSecuritySchema,
  createReceivableEnhancedSchema,
  purchaseSecuritySchema,
  updateProfileEnhancedSchema
} from "@shared/schema";
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

      const validation = createReceivableEnhancedSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { amount, dueDiligence, ...rest } = validation.data;
      const receivable = await storage.createReceivable(userId, {
        ...rest,
        amount: amount,
        orderPhotos: dueDiligence?.orderPhotos || null,
        legalDocuments: dueDiligence?.legalDocuments || null,
        debtorContact: dueDiligence?.debtorContact || null,
        orderDetails: dueDiligence?.orderDetails || null,
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

      // Note: In a production system, you might want to notify investors about new listings
      // For now, we'll focus on notifications for direct user actions
      
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

  // Get individual security details
  app.get('/api/security/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const security = await storage.getSecurity(id);
      
      if (!security) {
        return res.status(404).json({ message: "Security not found" });
      }

      // Only return listed securities for public access
      if (security.status !== "listed") {
        return res.status(404).json({ message: "Security not available" });
      }

      res.json(security);
    } catch (error) {
      console.error("Error fetching security details:", error);
      res.status(500).json({ message: "Failed to fetch security details" });
    }
  });

  // Investor routes
  app.post('/api/securities/:id/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'investor') {
        return res.status(403).json({ message: "Only investors can purchase securities" });
      }

      const validation = purchaseSecuritySchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { paymentMethod, amount } = validation.data;

      // Get security details
      const security = await storage.getSecurity(id);
      if (!security || security.status !== "listed") {
        return res.status(400).json({ message: "Security not available for purchase" });
      }

      // Calculate commission (1% from both buyer and seller)
      const commissionAmount = parseFloat(security.totalValue) * 0.01;
      const totalAmount = parseFloat(security.totalValue) + commissionAmount;

      // Simulate payment processing
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        securityId: id,
        buyerId: userId,
        sellerId: security.merchantId,
        amount: security.totalValue,
        currency: security.currency,
        commissionAmount: commissionAmount.toString(),
        paymentMethod,
        status: "completed",
        transactionId,
        gatewayResponse: {
          success: true,
          transactionId,
          amount: totalAmount,
          commission: commissionAmount,
        },
      });

      // Purchase the security
      const purchasedSecurity = await storage.purchaseSecurity(id, userId);
      
      // Update security with payment details
      await storage.updateSecurity(id, {
        paymentMethod,
        paymentStatus: "completed",
        transactionId,
        commissionAmount: commissionAmount.toString(),
      });

      // Update related receivable status to sold
      await storage.updateReceivable(security.receivableId, { status: "sold" });

      // Update merchant's wallet balance (amount minus commission)
      const merchantAmount = parseFloat(security.totalValue) - commissionAmount;
      await storage.updateUserWalletBalance(security.merchantId, merchantAmount);

      // Create notification for merchant
      await storage.createNotification({
        userId: security.merchantId,
        type: "security_purchased",
        title: "Security Purchased!",
        message: `Your security "${security.title}" has been purchased for $${parseFloat(security.totalValue).toLocaleString()}. Commission: $${commissionAmount.toFixed(2)}`,
        data: {
          securityId: security.id,
          securityTitle: security.title,
          amount: security.totalValue,
          commission: commissionAmount,
          transactionId,
        },
        read: false,
      });

      // Create notification for investor
      await storage.createNotification({
        userId: userId,
        type: "security_purchased",
        title: "Purchase Successful!",
        message: `You have successfully purchased "${security.title}" for $${totalAmount.toLocaleString()}.`,
        data: {
          securityId: security.id,
          securityTitle: security.title,
          amount: totalAmount,
          commission: commissionAmount,
          transactionId,
        },
        read: false,
      });

      res.json({
        security: purchasedSecurity,
        transaction,
        commission: commissionAmount,
        totalAmount,
      });
    } catch (error) {
      console.error("Error purchasing security:", error);
      if ((error as Error).message === "Security not found or already purchased") {
        res.status(400).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Failed to purchase security" });
      }
    }
  });

  app.get('/api/investor/securities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'investor') {
        return res.status(403).json({ message: "Only investors can access purchased securities" });
      }

      const securities = await storage.getPurchasedSecurities(userId);
      res.json(securities);
    } catch (error) {
      console.error("Error fetching purchased securities:", error);
      res.status(500).json({ message: "Failed to fetch purchased securities" });
    }
  });

  // Payment settlement routes
  app.post('/api/securities/:id/mark-paid', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'merchant') {
        return res.status(403).json({ message: "Only merchants can mark securities as paid" });
      }

      // Check if security belongs to the merchant and is in a payable status
      const existingSecurity = await storage.getSecurity(id);
      if (!existingSecurity || existingSecurity.merchantId !== userId) {
        return res.status(404).json({ message: "Security not found" });
      }

      if (existingSecurity.status !== "purchased" && existingSecurity.status !== "payment_due") {
        return res.status(400).json({ message: "Security cannot be marked as paid in its current status" });
      }

      // Mark security as paid
      const paidSecurity = await storage.markSecurityAsPaid(id);

      // Update investor's wallet balance
      if (existingSecurity.purchasedBy) {
        await storage.updateUserWalletBalance(
          existingSecurity.purchasedBy, 
          parseFloat(existingSecurity.totalValue)
        );

        // Create notification for investor about payment received
        await storage.createNotification({
          userId: existingSecurity.purchasedBy,
          type: "payment_received",
          title: "Payment Received!",
          message: `Payment of $${parseFloat(existingSecurity.totalValue).toLocaleString()} has been received for security "${existingSecurity.title}".`,
          data: {
            securityId: existingSecurity.id,
            securityTitle: existingSecurity.title,
            amount: existingSecurity.totalValue,
          },
          read: false,
        });
      }

      // Create confirmation notification for merchant
      await storage.createNotification({
        userId: userId,
        type: "payment_received",
        title: "Payment Processed",
        message: `You have successfully marked security "${existingSecurity.title}" as paid.`,
        data: {
          securityId: existingSecurity.id,
          securityTitle: existingSecurity.title,
          amount: existingSecurity.totalValue,
        },
        read: false,
      });

      res.json(paidSecurity);
    } catch (error) {
      console.error("Error marking security as paid:", error);
      res.status(500).json({ message: "Failed to mark security as paid" });
    }
  });

  // Profile management routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validation = updateProfileEnhancedSchema.safeParse(req.body);
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const updatedUser = await storage.updateUserProfile(userId, validation.data);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Transaction history routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/transactions/:securityId', isAuthenticated, async (req: any, res) => {
    try {
      const { securityId } = req.params;
      const transactions = await storage.getTransactionsBySecurity(securityId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching security transactions:", error);
      res.status(500).json({ message: "Failed to fetch security transactions" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearAllNotifications(userId);
      res.json({ message: "All notifications cleared successfully" });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Watchlist routes
  app.get('/api/watchlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const watchlist = await storage.getUserWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post('/api/watchlist/:securityId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { securityId } = req.params;
      const watchlistItem = await storage.addToWatchlist(userId, securityId);
      res.json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete('/api/watchlist/:securityId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { securityId } = req.params;
      await storage.removeFromWatchlist(userId, securityId);
      res.json({ message: "Removed from watchlist" });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  app.post('/api/watchlist/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchasedSecurities = await storage.purchaseWatchlistItems(userId);
      res.json(purchasedSecurities);
    } catch (error) {
      console.error("Error purchasing watchlist items:", error);
      res.status(500).json({ message: "Failed to purchase watchlist items" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
