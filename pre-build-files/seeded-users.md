# Seeded Users Documentation

This document contains all test users created by the database seed script for development and testing purposes.

## Default Password
All seeded users use the same password for convenience during development:
- **Password**: `password123`

## Admin Users

| ID | Email | Name | Role | Phone | Status |
|---|---|---|---|---|---|
| admin-1 | admin@industrialnexus.com | Adebayo Okafor | SUPER_ADMIN | +2348012345678 | ACTIVE |
| admin-2 | operations@industrialnexus.com | Chinedu Eze | OPERATIONS | +2348023456789 | ACTIVE |
| admin-3 | supervisor@industrialnexus.com | Fatima Bello | OPERATIONS | +2348034567890 | ACTIVE |

## Client Users

| ID | Email | Name | Role | Phone | Status |
|---|---|---|---|---|---|
| client-1 | client1@company.com | Emeka Nwosu | CLIENT | +2348045678901 | ACTIVE |
| client-2 | client2@logistics.ng | Aisha Mohammed | CLIENT | +2348056789012 | ACTIVE |
| client-3 | client3@manufacturing.com | Oluwaseun Adeyemi | CLIENT | +2348067890123 | ACTIVE |
| client-4 | client4@construction.ng | Chukwudi Okonkwo | CLIENT | +2348078901234 | ACTIVE |

## Active Driver Users

| ID | Email | Name | Role | Phone | Status |
|---|---|---|---|---|---|
| driver-1 | driver1@industrialnexus.com | Ibrahim Mohammed | DRIVER | +2348089012345 | ACTIVE |
| driver-2 | driver2@industrialnexus.com | Chukwuemeka Okonkwo | DRIVER | +2348090123456 | ACTIVE |
| driver-3 | driver3@industrialnexus.com | Aishat Yusuf | DRIVER | +2348101234567 | ACTIVE |
| driver-4 | driver4@industrialnexus.com | Olanrewaju Babatunde | DRIVER | +2348112345678 | ACTIVE |
| driver-5 | driver5@industrialnexus.com | Grace Nnamdi | DRIVER | +2348123456789 | ACTIVE |

## Inactive Driver Users

| ID | Email | Name | Role | Phone | Status |
|---|---|---|---|---|---|
| driver-6 | driver6@industrialnexus.com | Kehinde Olawale | DRIVER | +2348134567890 | INACTIVE |
| driver-7 | driver7@industrialnexus.com | Nnamdi Okafor | DRIVER | +2348145678901 | SUSPENDED |
| driver-8 | driver8@industrialnexus.com | Zainab Aliyu | DRIVER | +2348156789012 | INACTIVE |

## Usage Instructions

### Admin PWA (http://localhost:3000)
- Use any admin user to access the admin dashboard
- Super Admin (admin-1) has full system access
- Operations users (admin-2, admin-3) can manage operations but not system settings

### Client PWA (http://localhost:3003)
- Use any client user (client-1 through client-4) to access the client portal
- Clients can create and manage their own orders

### Driver PWA (http://localhost:3002)
- Use active driver users (driver-1 through driver-5) for normal driver operations
- Use inactive drivers (driver-6 through driver-8) to test driver status handling

## Role Permissions

- **SUPER_ADMIN**: Full system access including user management, system configuration
- **OPERATIONS**: Can manage orders, trips, and operational workflows
- **CLIENT**: Can create and view their own orders and shipments
- **DRIVER**: Can view assigned trips, update delivery status, and manage POD

## User Status

- **ACTIVE**: User can login and access the system normally
- **INACTIVE**: User account is disabled and cannot login
- **SUSPENDED**: User account is temporarily suspended and cannot login

## Notes

- All passwords are hashed using bcrypt with salt rounds of 10
- Phone numbers use Nigerian format (+234)
- Last login times are set to various times in the past for realistic test data
- Users are created in the order: Admin → Client → Drivers to respect foreign key constraints
