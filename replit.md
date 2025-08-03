# replit.md

## Overview

SecureReceivables is a full-stack web application for receivables securitization and investment opportunities. The platform connects merchants who want to securitize their receivables with investors looking for investment opportunities. Users can register as either merchants or investors and access role-specific dashboards with tailored functionality.

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