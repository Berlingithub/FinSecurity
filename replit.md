# replit.md

## Overview

SecureReceivables is a full-stack web application for receivables securitization and investment opportunities. The platform connects merchants who want to securitize their receivables with investors looking for investment opportunities. Users can register as either merchants or investors and access role-specific dashboards with tailored functionality.

## Recent Changes (August 2025)

### Merchant Receivables Management Module
- Added comprehensive receivables creation and management system
- Database schema updated with receivables table including merchant relations
- Full CRUD API endpoints for receivables with proper authentication
- Enhanced merchant dashboard with:
  - Interactive receivables creation form with validation
  - Real-time receivables listing with status badges
  - Dynamic statistics based on actual data
  - Bulk operations and individual receivable management
- Form validation using Zod schemas for data integrity
- Responsive UI with modal dialogs and loading states

### Securitization and Marketplace Integration
- Implemented complete securitization workflow for trade receivables
- Added securities database table with comprehensive financial metadata
- Enhanced receivables status tracking (draft → active → securitized → listed → purchased/sold)
- Built securitization form with investment-specific fields:
  - Security title and description for investor visibility
  - Risk grading system (A to C- ratings)
  - Expected return percentage calculations
  - Investment duration specifications
- Marketplace listing functionality for securitized assets
- Status-based action buttons (Securitize → List for Sale → On Marketplace)
- Real-time dashboard statistics including listed securities count
- Public marketplace API endpoint for investor access
- Comprehensive error handling and loading states throughout workflow

### Investor Security Purchase System
- Added comprehensive purchase functionality for listed securities
- Enhanced securities schema with purchase tracking fields:
  - purchasedBy field linking to investor ID
  - purchasedAt timestamp for transaction recording
  - Updated status enum to include "purchased" state
- Built secure purchase API endpoints with role-based authorization
- Implemented purchase confirmation modal with detailed security information
- Added "My Purchased Securities" tab on investor dashboard showing owned investments
- Purchase process automatically:
  - Updates security status from "listed" to "purchased"
  - Removes securities from public marketplace to prevent double-purchasing
  - Updates related receivable status to "sold"
  - Records investor ID and purchase timestamp
- Real-time dashboard statistics reflecting both marketplace and purchased securities
- Enhanced error handling for purchase conflicts and authorization

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing with role-based navigation
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API development
- **Language**: TypeScript for type safety across the entire stack
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints with structured error handling and request logging

### Data Layer
- **Database**: PostgreSQL with Neon serverless hosting for scalability
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: User management with role-based access control (merchant/investor roles)
- **Validation**: Zod schemas shared between client and server for consistent data validation

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Role-Based Access**: User roles (merchant/investor) determine dashboard access and features
- **Security**: HTTP-only cookies, CSRF protection, and secure session management

### Development Environment
- **Monorepo Structure**: Shared types and schemas between client and server
- **Hot Reload**: Vite dev server with Express middleware integration
- **TypeScript**: Strict type checking across the entire codebase
- **Path Aliases**: Configured for clean import statements and better developer experience

## External Dependencies

### Authentication Services
- **Replit Auth**: Primary authentication provider using OpenID Connect
- **Passport.js**: Authentication middleware for Express.js integration

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### UI & Styling
- **shadcn/ui**: Pre-built accessible React components with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Build tool with development server and production optimization
- **ESBuild**: Fast TypeScript compilation for server-side code
- **TypeScript**: Type checking and compilation for both client and server

### Runtime Dependencies
- **React Query**: Server state management and caching
- **Wouter**: Lightweight routing library for React
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition