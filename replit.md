# replit.md

## Overview
SecureReceivables is a full-stack web application designed for receivables securitization and investment. It connects merchants looking to securitize their receivables with investors seeking investment opportunities. The platform supports user registration as either a merchant or an investor, providing role-specific dashboards with tailored functionalities including dynamic filtering, an e-commerce-style watchlist, and comprehensive receivables management. The project aims to provide a robust, scalable, and user-friendly marketplace for financial assets, emphasizing ease of discovery and secure transactions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter for lightweight client-side routing with role-based navigation.
- **State Management**: TanStack Query for server state management and caching.
- **Styling**: Tailwind CSS with shadcn/ui for a consistent design system.
- **Form Handling**: React Hook Form with Zod validation.
- **Build Tool**: Vite for fast development and optimized production builds.
- **UI/UX Decisions**: Enhanced visual design with improved typography, spacing, color consistency, smooth animations, comprehensive loading states (skeleton, spinners), enhanced empty states, and improved form validation with real-time feedback. Responsive design is prioritized for all screen sizes. Dynamic real-time filter counts, multi-select filtering, and an e-commerce-style watchlist/shopping cart feature (add to cart, purchase all, item removal) have been implemented.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript for type safety.
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js.
- **Session Management**: Express sessions with PostgreSQL storage.
- **API Design**: RESTful endpoints with structured error handling.
- **System Design**: Features include a comprehensive receivables creation and management system, securitization workflow, marketplace listing, investor security purchase system, payment settlement and wallet system, and user profile management. A microservices architecture is planned for scalability. Role-based access control (merchant/investor) is central to the system.

### Data Layer
- **Database**: PostgreSQL with Neon serverless hosting.
- **ORM**: Drizzle ORM for type-safe database operations and migrations.
- **Schema**: Supports user management with role-based access, receivables with categories (Manufacturing, Retail, Technology, Services, Healthcare, Finance, Construction, Agriculture) and risk levels (Low, Medium, High), securities with financial metadata, and transaction tracking.
- **Validation**: Zod schemas for consistent data validation across client and server.

## External Dependencies

### Authentication Services
- **Replit Auth**: Primary authentication provider (OpenID Connect).
- **Passport.js**: Authentication middleware for Express.js.

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle Kit**: Database migration and schema management.

### UI & Styling
- **shadcn/ui**: Pre-built accessible React components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Build tool.
- **ESBuild**: Fast TypeScript compilation.
- **TypeScript**: Type checking and compilation.

### Runtime Dependencies
- **React Query**: Server state management.
- **Wouter**: Routing library.
- **React Hook Form**: Form state management.
- **Zod**: Runtime type validation.
```