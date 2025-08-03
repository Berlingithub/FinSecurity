import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerUserSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
