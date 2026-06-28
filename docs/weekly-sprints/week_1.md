Using the Industrial Nexus Master Pack specification:

Step 2
Prompt:
Execute Week_1.md. Core Foundation.

Business Objective:
Establish the foundational architecture, authentication system, authorization model, database layer, and monorepo structure required for all future modules.

Requirements:
Monorepo Setup

Create:
apps/
├── backend
├── admin-pwa
├── client-pwa
├── driver-pwa

packages/
├── types
├── ui
├── config

Backend Stack
- NestJS
- PostgreSQL
- Prisma ORM
- TypeScript (strict mode)

Authentication Module
Implement:
- Login
- Logout
- Access Token
- Refresh Token
- Password Hashing
- Password Reset
- Session Management

RBAC Module
Roles:
SUPER_ADMIN
OPERATIONS
CLIENT
DRIVER

Requirements:
- Role Guards
- Permission Checks
- Route Protection
- User Role Assignment

User Management Module
Implement:
- Create User
- Update User
- Deactivate User
- View User
- Search Users

User Fields:
- First Name
- Last Name
- Email
- Phone Number
- Password
- Role
- Status

Validation Rules:
- Unique Email
- Strong Password Policy
- Required Role Assignment

Audit Requirements:
Track:
- Login Events
- Logout Events
- User Creation
- User Updates
- Role Changes

Acceptance Criteria:
- Users can authenticate successfully
- JWT authentication is functional
- RBAC is enforced
- User CRUD operations work correctly
- Audit logs are generated
- Database migrations execute successfully

Generate:
- Monorepo folder structure
- Installation commands
- Backend setup commands
- Prisma schema
- Authentication module
- RBAC module
- User module
- DTOs
- Controllers
- Services
- Guards
- Database migrations
- Seed data
- Environment variables
- Unit tests
- Integration tests
- Setup documentation

Output:
- Folder structure
- Commands
- Source code
- Prisma schema
- Environment variables
- Setup instructions

Follow the Industrial Nexus Master Pack specification.

Do not generate Week 2 functionality.