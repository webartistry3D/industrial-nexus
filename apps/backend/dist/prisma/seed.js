"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seed...');
    console.log('Cleaning up existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.geofenceEvent.deleteMany();
    await prisma.geofence.deleteMany();
    await prisma.kittingLog.deleteMany();
    await prisma.pOD.deleteMany();
    await prisma.weightRecord.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.handlingTag.deleteMany();
    await prisma.order.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    console.log('Cleanup complete.');
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@industrialnexus.com' },
        update: {},
        create: {
            email: 'superadmin@industrialnexus.com',
            passwordHash: superAdminPassword,
            firstName: 'System',
            lastName: 'Administrator',
            phoneNumber: '+2348000000001',
            role: client_1.UserRole.SUPER_ADMIN,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    console.log('Created Super Admin:', superAdmin.email);
    const opsPassword = await bcrypt.hash('OpsManager123!', 10);
    const opsManager = await prisma.user.upsert({
        where: { email: 'operations@industrialnexus.com' },
        update: {},
        create: {
            email: 'operations@industrialnexus.com',
            passwordHash: opsPassword,
            firstName: 'Operations',
            lastName: 'Manager',
            phoneNumber: '+2348000000002',
            role: client_1.UserRole.OPERATIONS,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    console.log('Created Operations Manager:', opsManager.email);
    const clientPassword = await bcrypt.hash('Client123!', 10);
    const client = await prisma.user.upsert({
        where: { email: 'client@example.com' },
        update: {},
        create: {
            email: 'client@example.com',
            passwordHash: clientPassword,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+2348000000003',
            role: client_1.UserRole.CLIENT,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    console.log('Created Client:', client.email);
    const vehicle = await prisma.vehicle.upsert({
        where: { plateNumber: 'LAG-123-XA' },
        update: {},
        create: {
            plateNumber: 'LAG-123-XA',
            category: client_1.VehicleCategory.HEAVY,
            capacityKg: 10000,
            status: client_1.VehicleStatus.ACTIVE,
            isPartitioned: true,
        },
    });
    console.log('Created Vehicle:', vehicle.plateNumber);
    const vehicle2 = await prisma.vehicle.upsert({
        where: { plateNumber: 'LAG-456-XB' },
        update: {},
        create: {
            plateNumber: 'LAG-456-XB',
            category: client_1.VehicleCategory.MEDIUM,
            capacityKg: 5000,
            status: client_1.VehicleStatus.ACTIVE,
            isPartitioned: false,
        },
    });
    console.log('Created Vehicle:', vehicle2.plateNumber);
    const driverPassword = await bcrypt.hash('Driver123!', 10);
    const driverUser = await prisma.user.upsert({
        where: { email: 'driver@industrialnexus.com' },
        update: {},
        create: {
            email: 'driver@industrialnexus.com',
            passwordHash: driverPassword,
            firstName: 'Aliyu',
            lastName: 'Mohammed',
            phoneNumber: '+2348000000004',
            role: client_1.UserRole.DRIVER,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    console.log('Created Driver User:', driverUser.email);
    const driver = await prisma.driver.upsert({
        where: { userId: driverUser.id },
        update: {},
        create: {
            userId: driverUser.id,
            licenseNumber: 'DL-1234567890',
            kycStatus: client_1.KycStatus.VERIFIED,
            status: client_1.DriverStatus.ACTIVE,
            availability: client_1.DriverAvailability.AVAILABLE,
            vehicleId: vehicle.id,
        },
    });
    console.log('Created Driver Profile:', driver.licenseNumber);
    const order = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-000001',
            clientId: client.id,
            status: client_1.OrderStatus.DELIVERED,
            totalWeight: 5000,
            priority: client_1.Priority.HIGH,
            pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Industrial Zone A, Lagos' },
            deliveryLocation: { lat: 6.5957, lng: 3.3370, address: 'Factory Complex B, Ogun' },
            cargoDescription: 'Industrial machinery parts',
            deliveryInstructions: 'Handle with care, fragile components inside',
            kittingStatus: client_1.KittingStatus.DISPATCH_READY,
        },
    });
    console.log('Created Order:', order.orderNumber);
    await prisma.handlingTag.createMany({
        data: [
            { orderId: order.id, tag: 'FRAGILE' },
            { orderId: order.id, tag: 'HEAVY' },
        ],
        skipDuplicates: true,
    });
    console.log('Created Handling Tags for Order');
    const trip = await prisma.trip.create({
        data: {
            orderId: order.id,
            driverId: driver.id,
            vehicleId: vehicle.id,
            status: client_1.TripStatus.DELIVERED,
            startedAt: new Date('2024-01-15T08:00:00Z'),
            completedAt: new Date('2024-01-15T14:30:00Z'),
        },
    });
    console.log('Created Trip for Order:', order.orderNumber);
    await prisma.weightRecord.create({
        data: {
            tripId: trip.id,
            orderId: order.id,
            cargoWeight: 5000,
            vehicleCapacity: 10000,
            utilization: 0.5,
            status: 'SAFE',
        },
    });
    console.log('Created Weight Record');
    const driver2Password = await bcrypt.hash('Driver123!', 10);
    const driver2User = await prisma.user.upsert({
        where: { email: 'driver2@industrialnexus.com' },
        update: {},
        create: {
            email: 'driver2@industrialnexus.com',
            passwordHash: driver2Password,
            firstName: 'Chinedu',
            lastName: 'Okafor',
            phoneNumber: '+2348000000005',
            role: client_1.UserRole.DRIVER,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const driver2 = await prisma.driver.upsert({
        where: { userId: driver2User.id },
        update: {},
        create: {
            userId: driver2User.id,
            licenseNumber: 'DL-0987654321',
            kycStatus: client_1.KycStatus.VERIFIED,
            status: client_1.DriverStatus.ACTIVE,
            availability: client_1.DriverAvailability.ON_TRIP,
            vehicleId: vehicle2.id,
        },
    });
    console.log('Created Driver 2:', driver2User.email);
    const client2Password = await bcrypt.hash('Client123!', 10);
    const client2 = await prisma.user.upsert({
        where: { email: 'client2@example.com' },
        update: {},
        create: {
            email: 'client2@example.com',
            passwordHash: client2Password,
            firstName: 'Sarah',
            lastName: 'Johnson',
            phoneNumber: '+2348000000006',
            role: client_1.UserRole.CLIENT,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    console.log('Created Client 2:', client2.email);
    const draftOrder = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-000002',
            clientId: client.id,
            status: client_1.OrderStatus.DRAFT,
            totalWeight: 2500,
            priority: client_1.Priority.NORMAL,
            pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Warehouse A, Lagos' },
            deliveryLocation: { lat: 6.5957, lng: 3.3370, address: 'Factory C, Ogun' },
            cargoDescription: 'Electronic components - sensitive equipment',
            deliveryInstructions: 'Temperature controlled, handle with extreme care',
            kittingStatus: client_1.KittingStatus.PENDING,
        },
    });
    await prisma.handlingTag.createMany({
        data: [
            { orderId: draftOrder.id, tag: 'TEMPERATURE_SENSITIVE' },
            { orderId: draftOrder.id, tag: 'FRAGILE' },
        ],
    });
    console.log('Created Draft Order:', draftOrder.orderNumber);
    const kittingOrder = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-000003',
            clientId: client2.id,
            status: client_1.OrderStatus.KITTING,
            totalWeight: 7500,
            priority: client_1.Priority.HIGH,
            pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Industrial Park, Lagos' },
            deliveryLocation: { lat: 6.5957, lng: 3.3370, address: 'Manufacturing Plant, Ogun' },
            cargoDescription: 'Heavy machinery parts - industrial grade',
            deliveryInstructions: 'Requires crane for loading/unloading',
            kittingStatus: client_1.KittingStatus.TECHNICAL_PACKAGING,
        },
    });
    await prisma.handlingTag.createMany({
        data: [
            { orderId: kittingOrder.id, tag: 'HEAVY' },
            { orderId: kittingOrder.id, tag: 'VERTICAL_STORAGE_REQUIRED' },
        ],
    });
    await prisma.kittingLog.createMany({
        data: [
            {
                orderId: kittingOrder.id,
                stage: 'AGGREGATION',
                operatorId: opsManager.id,
                notes: 'Started collecting parts from warehouse sections A-C',
            },
            {
                orderId: kittingOrder.id,
                stage: 'AGGREGATION',
                operatorId: opsManager.id,
                barcodeVerified: true,
                notes: 'All 47 components collected and verified against manifest',
            },
            {
                orderId: kittingOrder.id,
                stage: 'TECHNICAL_PACKAGING',
                operatorId: opsManager.id,
                notes: 'Custom foam inserts prepared for fragile components',
            },
        ],
    });
    console.log('Created Kitting Order with logs:', kittingOrder.orderNumber);
    const assignedOrder = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-000004',
            clientId: client.id,
            status: client_1.OrderStatus.ASSIGNED,
            totalWeight: 3500,
            priority: client_1.Priority.URGENT,
            pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Distribution Center, Lagos' },
            deliveryLocation: { lat: 6.5957, lng: 3.3370, address: 'Construction Site, Ogun' },
            cargoDescription: 'Chemical supplies - industrial solvents',
            deliveryInstructions: 'HAZMAT protocols required, safety equipment mandatory',
            kittingStatus: client_1.KittingStatus.DISPATCH_READY,
        },
    });
    await prisma.handlingTag.createMany({
        data: [
            { orderId: assignedOrder.id, tag: 'CHEMICAL' },
            { orderId: assignedOrder.id, tag: 'HAZARDOUS' },
        ],
    });
    const activeTrip = await prisma.trip.create({
        data: {
            orderId: assignedOrder.id,
            driverId: driver2.id,
            vehicleId: vehicle2.id,
            status: client_1.TripStatus.IN_TRANSIT,
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
    });
    await prisma.weightRecord.create({
        data: {
            tripId: activeTrip.id,
            orderId: assignedOrder.id,
            cargoWeight: 3500,
            vehicleCapacity: 5000,
            utilization: 0.7,
            status: 'WARNING',
        },
    });
    console.log('Created Active Trip (WARNING weight):', activeTrip.id);
    const heavyOrder = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-000005',
            clientId: client2.id,
            status: client_1.OrderStatus.ASSIGNED,
            totalWeight: 12000,
            priority: client_1.Priority.HIGH,
            pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Steel Mill, Lagos' },
            deliveryLocation: { lat: 6.5957, lng: 3.3370, address: 'Fabrication Yard, Ogun' },
            cargoDescription: 'Steel beams and structural components',
            deliveryInstructions: 'Heavy load - requires heavy-duty vehicle',
            kittingStatus: client_1.KittingStatus.DISPATCH_READY,
        },
    });
    await prisma.handlingTag.createMany({
        data: [
            { orderId: heavyOrder.id, tag: 'HEAVY' },
        ],
    });
    const heavyTrip = await prisma.trip.create({
        data: {
            orderId: heavyOrder.id,
            driverId: driver.id,
            vehicleId: vehicle.id,
            status: client_1.TripStatus.ASSIGNED,
        },
    });
    await prisma.weightRecord.create({
        data: {
            tripId: heavyTrip.id,
            orderId: heavyOrder.id,
            cargoWeight: 12000,
            vehicleCapacity: 10000,
            utilization: 1.2,
            status: 'OVERLOADED',
        },
    });
    console.log('Created Overloaded Trip (Weight Watch alert):', heavyTrip.id);
    const deliveredOrder = await prisma.order.create({
        data: {
            orderNumber: 'ORD-2024-000006',
            clientId: client.id,
            status: client_1.OrderStatus.DELIVERED,
            totalWeight: 4200,
            priority: client_1.Priority.NORMAL,
            pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Logistics Hub, Lagos' },
            deliveryLocation: { lat: 6.5957, lng: 3.3370, address: 'Retail Center, Ogun' },
            cargoDescription: 'Consumer electronics - TVs and appliances',
            deliveryInstructions: 'Deliver to loading dock, obtain signature',
            kittingStatus: client_1.KittingStatus.DISPATCH_READY,
        },
    });
    const deliveredTrip = await prisma.trip.create({
        data: {
            orderId: deliveredOrder.id,
            driverId: driver.id,
            vehicleId: vehicle.id,
            status: client_1.TripStatus.DELIVERED,
            startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        },
    });
    await prisma.pOD.create({
        data: {
            tripId: deliveredTrip.id,
            imageUrl: 'https://example.com/pod/photo1.jpg',
            signatureUrl: 'https://example.com/pod/signature1.png',
            notes: 'Delivered on time, receiver confirmed all items in good condition',
            capturedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
            lat: 6.5957,
            lng: 3.3370,
        },
    });
    console.log('Created Delivered Trip with POD:', deliveredTrip.id);
    const geofence = await prisma.geofence.create({
        data: {
            name: 'Lagos Industrial Zone',
            type: 'RADIUS',
            centerLat: 6.5244,
            centerLng: 3.3792,
            radiusA: 5000,
            radiusB: 1000,
            radiusC: 100,
            isActive: true,
        },
    });
    await prisma.geofenceEvent.createMany({
        data: [
            {
                tripId: activeTrip.id,
                geofenceId: geofence.id,
                eventType: 'RADIUS_A_ENTERED',
                lat: 6.5244,
                lng: 3.3792,
                triggeredAt: new Date(),
            },
            {
                tripId: activeTrip.id,
                geofenceId: geofence.id,
                eventType: 'RADIUS_B_ENTERED',
                lat: 6.5957,
                lng: 3.3370,
                triggeredAt: new Date(),
            },
        ],
    });
    console.log('Created Geofence Events');
    await prisma.auditLog.createMany({
        data: [
            {
                userId: superAdmin.id,
                action: 'CREATE',
                entityType: 'User',
                entityId: driverUser.id,
                newValue: { email: driverUser.email, role: 'DRIVER' },
            },
            {
                userId: opsManager.id,
                action: 'CREATE',
                entityType: 'Order',
                entityId: kittingOrder.id,
                newValue: { orderNumber: kittingOrder.orderNumber },
            },
            {
                userId: driverUser.id,
                action: 'CREATE',
                entityType: 'Trip',
                entityId: activeTrip.id,
                newValue: { tripId: activeTrip.id, status: 'IN_TRANSIT' },
            },
        ],
    });
    console.log('Created Audit Logs');
    console.log('\n========================================');
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('Default Login Credentials:');
    console.log('--------------------------');
    console.log('Super Admin: superadmin@industrialnexus.com / SuperAdmin123!');
    console.log('Operations:  operations@industrialnexus.com / OpsManager123!');
    console.log('Client 1:    client@example.com / Client123!');
    console.log('Client 2:    client2@example.com / Client123!');
    console.log('Driver 1:    driver@industrialnexus.com / Driver123!');
    console.log('Driver 2:    driver2@industrialnexus.com / Driver123!');
    console.log('\nTest Scenarios Created:');
    console.log('-----------------------');
    console.log('- 1 Draft Order (pending submission)');
    console.log('- 1 Kitting Order (in progress with logs)');
    console.log('- 1 Active Trip (WARNING weight status)');
    console.log('- 1 Overloaded Trip (OVERLOADED - dispatch blocked)');
    console.log('- 1 Delivered Trip (with POD)');
    console.log('- Geofence events for tracking');
    console.log('- Audit logs for compliance');
    console.log('\n========================================');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map