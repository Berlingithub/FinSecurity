# replit.md

## Overview

SecureReceivables is a full-stack web application for receivables securitization and investment opportunities. The platform connects merchants who want to securitize their receivables with investors looking for investment opportunities. Users can register as either merchants or investors and access role-specific dashboards with tailored functionality.

## Recent Changes (August 2025)

### Dynamic Filter Counts & Refined Interactive Multi-Select Filters (August 2025)
- Implemented comprehensive multi-select filtering system for advanced investment discovery:
  - Replaced single-select dropdowns with multi-select filter buttons for categories, risk levels, and currencies
  - Added dynamic real-time item counts next to each filter option (e.g., "Manufacturing (12)", "Low Risk (5)")
  - Filter counts automatically update based on current filter combinations for accurate availability
  - Enhanced visual indicators showing selected vs unselected states with blue highlighting
- Applied filters summary section with removable filter tags:
  - Displays active filters as removable badges (e.g., "Filtered by: Manufacturing, Low Risk")
  - Individual 'x' buttons on each filter tag for easy removal
  - "Clear All" button to reset all filters at once
  - Real-time filter persistence across navigation and interactions
- Advanced multi-select functionality:
  - Investors can select multiple categories simultaneously (Manufacturing + Technology + Healthcare)
  - Multi-risk level selection (Low + Medium risk securities)
  - Multi-currency filtering for international diversification
  - Instant updates without page reload for smooth browsing experience
- Enhanced sidebar navigation with multi-select support:
  - Category and risk level buttons with checkbox-style multi-selection
  - Dynamic counts showing available securities for each option
  - Active highlighting and chevron indicators for selected filters
  - Persistent filter state across mobile and desktop interfaces
- Complete e-commerce-style filtering experience mimicking major platforms like Amazon
- Seamless integration with existing search, sorting, and watchlist functionality

### E-Commerce Watchlist/Shopping Cart Feature (August 2025)
- Implemented complete shopping cart-style functionality for investors:
  - Replaced direct "Purchase" buttons with "Add to Cart" buttons on security cards
  - Added persistent shopping cart icon in top-right corner with real-time item count badge
  - Created comprehensive watchlist modal with full item management capabilities
  - Implemented "Purchase All" batch purchasing functionality allowing investors to buy multiple securities in one transaction
  - Added individual item removal from watchlist with clear visual feedback
  - Integrated watchlist total value calculation and prominent display
  - Built "Clear All" functionality to empty entire watchlist
  - Enhanced empty state with actionable guidance for users
- Database and API infrastructure already supported watchlist operations:
  - Watchlist table with proper user-security relationships
  - Complete API endpoints for add/remove/purchase batch operations
  - Real-time query invalidation for seamless UI updates
- Shopping cart experience seamlessly integrates with existing filtering system:
  - Users can filter and search securities, then add selected items to watchlist
  - Watchlist persists across filter changes and navigation
  - Batch purchase updates all related securities and receivables statuses
- Complete e-commerce user journey: Browse → Filter → Add to Cart → Review → Batch Purchase

### Advanced Marketplace Categorization and Filtering System (August 2025)
- Enhanced database schema with category and risk level fields for receivables:
  - Added category field with options: Manufacturing, Retail, Technology, Services, Healthcare, Finance, Construction, Agriculture
  - Added riskLevel field with options: Low, Medium, High
  - Updated storage API to include new fields in marketplace listings
- Enhanced merchant receivable creation form:
  - Added category selection dropdown with visual icons
  - Added risk level selection with color-coded indicators
  - Updated form validation and default values
- Implemented comprehensive search and filtering system for investor marketplace:
  - Added prominent search bar with real-time filtering by title, description, debtor, or merchant name
  - Added category filter with industry-specific icons (Factory, Store, Computer, etc.)
  - Added risk level filter with color-coded indicators (green/yellow/red)
  - Enhanced currency filter integration
  - Added "Clear All Filters" functionality
  - Combined filters work together for precise investment discovery
- Enhanced product card display:
  - Added category information with relevant icons
  - Added risk level display with color-coded dots and text
  - Improved visual hierarchy and information layout
  - Enhanced filtering logic to work across all new fields
- Improved user experience:
  - Real-time search with instant results
  - Visual filter indicators and clear filter states
  - Responsive design for all screen sizes
  - Enhanced skeleton loading states matching new card layout

### Production Deployment and Scalability Planning (January 2025)
- Developed comprehensive production deployment strategy covering:
  - Backend architecture recommendations (Node.js/Express with PostgreSQL)
  - Multi-factor authentication and role-based access control implementation
  - Real-time update system using WebSockets and Redis pub/sub
  - Payment gateway integration with Stripe, KYC/AML compliance
  - Legal document management with DocuSign and blockchain timestamping
  - Microservices architecture for scalability and maintainability
  - Security best practices including encryption, API protection, and monitoring
  - Cloud deployment strategy using AWS with CI/CD pipelines
  - Performance optimization through caching, load balancing, and CDN

### UI/UX Enhancements and Polish (January 2025)
- Enhanced visual design with improved typography, spacing, and color consistency
- Added smooth animations and transitions throughout the application:
  - Button hover effects with subtle scaling
  - Card hover animations with shadow and translate effects
  - Fade-in and slide-up animations for content loading
  - Enhanced focus states for better accessibility
- Implemented comprehensive loading states:
  - Skeleton loading cards for data fetching
  - Loading spinners with consistent sizing
  - Button loading states with opacity and spinner indicators
- Enhanced empty states across all sections:
  - Reusable EmptyState component with icons, titles, and action buttons
  - Context-aware messages based on filters and user state
  - Actionable empty states that guide user behavior
- Improved form validation with real-time feedback:
  - Enhanced field validation with visual error/success states
  - Better error messages and field-specific validation
  - Improved input focus states and transitions
- Responsive design improvements:
  - Better mobile and tablet layouts with Tailwind responsive utilities
  - Improved button and layout spacing for different screen sizes
  - Enhanced grid layouts with proper responsive breakpoints
- Enhanced component styling:
  - Card hover effects and smooth transitions
  - Better visual hierarchy with improved typography
  - Consistent spacing and border radius throughout
  - Custom scrollbar styling for better aesthetics

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

### Payment Settlement and Wallet System
- Implemented comprehensive wallet balance functionality for investors
- Added walletBalance field to user schema with automatic migration
- Built "Mark as Paid" functionality for merchants to process payments
- Created payment settlement API endpoints with proper authorization
- Enhanced investor dashboard with prominent wallet balance display
- Automatic balance updates when merchants mark securities as paid
- Complete payment lifecycle from receivable creation to final settlement

### User Profile Management System
- Enhanced user schema with profile fields (phoneNumber, address)
- Created comprehensive Profile/Settings page accessible from both dashboards
- Implemented client-side persistence using localStorage for profile data
- Built profile management API endpoints with proper authorization
- Features include:
  - View and edit personal information (name, phone, address)
  - Professional bank details placeholder section
  - Form validation using Zod schemas
  - Real-time profile updates with unsaved changes tracking
  - Responsive design with clean navigation integration
- Profile navigation integrated into both merchant and investor dashboards
- Complete CRUD operations for user profile data with proper error handling

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