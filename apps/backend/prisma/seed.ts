import { PrismaClient, UserRole, UserStatus, DriverStatus, KycStatus, DriverAvailability, VehicleCategory, VehicleStatus, OrderStatus, Priority, KittingStatus, TripStatus, WeightStatus, GeofenceType, GeofenceEventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v5 as uuidv5 } from 'uuid';

const prisma = new PrismaClient();

// Deterministic UUID generation namespace for seed data
// This ensures the same seed always produces the same UUIDs, maintaining stable relationships
const SEED_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const id = (seed: string): string => uuidv5(seed, SEED_NAMESPACE);

// Realistic Nigerian locations (Lagos and surrounding areas)
const locations = {
  lagosMainland: { lat: 6.5244, lng: 3.3792, address: 'Ikeja, Lagos, Nigeria' },
  lagosIsland: { lat: 6.6018, lng: 3.3515, address: 'Victoria Island, Lagos, Nigeria' },
  lekki: { lat: 6.4281, lng: 3.4219, address: 'Lekki Phase 1, Lagos, Nigeria' },
  ikeja: { lat: 6.6018, lng: 3.3515, address: 'Ikeja GRA, Lagos, Nigeria' },
  ajah: { lat: 6.4556, lng: 3.5467, address: 'Ajah, Lagos, Nigeria' },
  surulere: { lat: 6.4980, lng: 3.3517, address: 'Surulere, Lagos, Nigeria' },
  yaba: { lat: 6.5244, lng: 3.3792, address: 'Yaba, Lagos, Nigeria' },
  mushin: { lat: 6.5357, lng: 3.3496, address: 'Mushin, Lagos, Nigeria' },
  apapa: { lat: 6.4498, lng: 3.3700, address: 'Apapa Port, Lagos, Nigeria' },
  ikorodu: { lat: 6.6189, lng: 3.5052, address: 'Ikorodu, Lagos, Nigeria' },
  festacTown: { lat: 6.4650, lng: 3.2750, address: 'Bode Thomas' },
  festacTownDelivery: { lat: 6.4680, lng: 3.2800, address: '5th Avenue, F1 Close, Festac Town, Lagos, Nigeria' },
  abuja: { lat: 9.0765, lng: 7.3986, address: 'Central Area, Abuja, Nigeria' },
  ibadan: { lat: 7.3775, lng: 3.9470, address: 'Ibadan, Oyo State, Nigeria' },
};

async function main() {
  console.log('🌱 Starting comprehensive database seed...');
  
  // Clean up existing data (in correct order to respect foreign keys)
  console.log('🧹 Cleaning up existing data...');
  await prisma.trackingPoint.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.geofenceEvent.deleteMany();
  await prisma.geofence.deleteMany();
  await prisma.kittingLog.deleteMany();
  await prisma.pOD.deleteMany();
  await prisma.weightRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.orderHandlingTag.deleteMany();
  await prisma.availableHandlingTag.deleteMany();
  await prisma.order.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Data cleaned successfully');

  // ==================== USERS ====================
  console.log('👥 Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin Users
  const adminUsers = [
    {
      id: id('admin-1'),
      email: 'admin@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Adebayo',
      lastName: 'Okafor',
      phoneNumber: '+2348012345678',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
    },
    {
      id: id('admin-2'),
      email: 'operations@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Chinedu',
      lastName: 'Eze',
      phoneNumber: '+2348023456789',
      role: UserRole.OPERATIONS,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 3600000),
    },
    {
      id: id('admin-3'),
      email: 'supervisor@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Fatima',
      lastName: 'Bello',
      phoneNumber: '+2348034567890',
      role: UserRole.OPERATIONS,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 7200000),
    },
  ];

  for (const admin of adminUsers) {
    await prisma.user.create({ data: admin });
  }

  // Client Users
  const clientUsers = [
    {
      id: id('client-1'),
      email: 'client1@company.com',
      passwordHash: hashedPassword,
      firstName: 'Emeka',
      lastName: 'Nwosu',
      phoneNumber: '+2348045678901',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 7200000),
    },
    {
      id: id('client-2'),
      email: 'client2@logistics.ng',
      passwordHash: hashedPassword,
      firstName: 'Aisha',
      lastName: 'Mohammed',
      phoneNumber: '+2348056789012',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 86400000),
    },
    {
      id: id('client-3'),
      email: 'client3@manufacturing.com',
      passwordHash: hashedPassword,
      firstName: 'Oluwaseun',
      lastName: 'Adeyemi',
      phoneNumber: '+2348067890123',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 172800000),
    },
    {
      id: id('client-4'),
      email: 'client4@construction.ng',
      passwordHash: hashedPassword,
      firstName: 'Chukwudi',
      lastName: 'Okonkwo',
      phoneNumber: '+2348078901234',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 259200000),
    },
  ];

  for (const client of clientUsers) {
    await prisma.user.create({ data: client });
  }

  // Driver Users - Active
  const activeDriverUsers = [
    {
      id: id('driver-1'),
      email: 'driver1@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Ibrahim',
      lastName: 'Mohammed',
      phoneNumber: '+2348089012345',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 1800000),
    },
    {
      id: id('driver-2'),
      email: 'driver2@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Chukwuemeka',
      lastName: 'Okonkwo',
      phoneNumber: '+2348090123456',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 5400000),
    },
    {
      id: id('driver-3'),
      email: 'driver3@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Aishat',
      lastName: 'Yusuf',
      phoneNumber: '+2348101234567',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 10800000),
    },
    {
      id: id('driver-4'),
      email: 'driver4@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Olanrewaju',
      lastName: 'Babatunde',
      phoneNumber: '+2348112345678',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 21600000),
    },
    {
      id: id('driver-5'),
      email: 'driver5@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Grace',
      lastName: 'Nnamdi',
      phoneNumber: '+2348123456789',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(Date.now() - 43200000),
    },
  ];

  for (const driver of activeDriverUsers) {
    await prisma.user.create({ data: driver });
  }

  // Driver Users - Inactive
  const inactiveDriverUsers = [
    {
      id: id('driver-6'),
      email: 'driver6@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Kehinde',
      lastName: 'Olawale',
      phoneNumber: '+2348134567890',
      role: UserRole.DRIVER,
      status: UserStatus.INACTIVE,
      lastLoginAt: new Date(Date.now() - 2592000000), // 30 days ago
    },
    {
      id: id('driver-7'),
      email: 'driver7@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Nnamdi',
      lastName: 'Okafor',
      phoneNumber: '+2348145678901',
      role: UserRole.DRIVER,
      status: UserStatus.SUSPENDED,
      lastLoginAt: new Date(Date.now() - 5184000000), // 60 days ago
    },
    {
      id: id('driver-8'),
      email: 'driver8@industrialnexus.com',
      passwordHash: hashedPassword,
      firstName: 'Zainab',
      lastName: 'Aliyu',
      phoneNumber: '+2348156789012',
      role: UserRole.DRIVER,
      status: UserStatus.INACTIVE,
      lastLoginAt: new Date(Date.now() - 7776000000), // 90 days ago
    },
  ];

  for (const driver of inactiveDriverUsers) {
    await prisma.user.create({ data: driver });
  }

  console.log(`✅ Created ${adminUsers.length} admin users, ${clientUsers.length} client users, ${activeDriverUsers.length} active drivers, ${inactiveDriverUsers.length} inactive drivers`);

  // ==================== VEHICLES ====================
  console.log('🚚 Creating vehicles...');

  const vehicles = [
    {
      id: id('vehicle-1'),
      plateNumber: 'ABC-123-NG',
      category: VehicleCategory.MEDIUM,
      capacityKg: 5000,
      status: VehicleStatus.ACTIVE,
      isPartitioned: true,
    },
    {
      id: id('vehicle-2'),
      plateNumber: 'DEF-456-NG',
      category: VehicleCategory.HEAVY,
      capacityKg: 10000,
      status: VehicleStatus.ACTIVE,
      isPartitioned: true,
    },
    {
      id: id('vehicle-3'),
      plateNumber: 'GHI-789-NG',
      category: VehicleCategory.LIGHT,
      capacityKg: 2000,
      status: VehicleStatus.ACTIVE,
      isPartitioned: false,
    },
    {
      id: id('vehicle-4'),
      plateNumber: 'JKL-012-NG',
      category: VehicleCategory.HEAVY,
      capacityKg: 15000,
      status: VehicleStatus.ACTIVE,
      isPartitioned: true,
    },
    {
      id: id('vehicle-5'),
      plateNumber: 'MNO-345-NG',
      category: VehicleCategory.MEDIUM,
      capacityKg: 6000,
      status: VehicleStatus.ACTIVE,
      isPartitioned: true,
    },
    {
      id: id('vehicle-6'),
      plateNumber: 'PQR-678-NG',
      category: VehicleCategory.LIGHT,
      capacityKg: 2500,
      status: VehicleStatus.MAINTENANCE,
      isPartitioned: false,
    },
    {
      id: id('vehicle-7'),
      plateNumber: 'STU-901-NG',
      category: VehicleCategory.SPECIALIZED,
      capacityKg: 8000,
      status: VehicleStatus.INACTIVE,
      isPartitioned: true,
    },
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.create({ data: vehicle });
  }

  console.log(`✅ Created ${vehicles.length} vehicles`);

  // ==================== DRIVERS ====================
  console.log('👨‍✈️ Creating driver profiles...');

  // Active drivers
  const activeDrivers = [
    {
      id: id('driver-profile-1'),
      userId: id('driver-1'),
      licenseNumber: 'LIC-NG-001234',
      kycStatus: KycStatus.VERIFIED,
      status: DriverStatus.ACTIVE,
      availability: DriverAvailability.AVAILABLE,
      vehicleId: id('vehicle-1'),
    },
    {
      id: id('driver-profile-2'),
      userId: id('driver-2'),
      licenseNumber: 'LIC-NG-002345',
      kycStatus: KycStatus.VERIFIED,
      status: DriverStatus.ACTIVE,
      availability: DriverAvailability.AVAILABLE,
      vehicleId: id('vehicle-2'),
    },
    {
      id: id('driver-profile-3'),
      userId: id('driver-3'),
      licenseNumber: 'LIC-NG-003456',
      kycStatus: KycStatus.VERIFIED,
      status: DriverStatus.ACTIVE,
      availability: DriverAvailability.AVAILABLE,
      vehicleId: id('vehicle-3'),
    },
    {
      id: id('driver-profile-4'),
      userId: id('driver-4'),
      licenseNumber: 'LIC-NG-004567',
      kycStatus: KycStatus.VERIFIED,
      status: DriverStatus.ACTIVE,
      availability: DriverAvailability.AVAILABLE,
      vehicleId: id('vehicle-4'),
    },
    {
      id: id('driver-profile-5'),
      userId: id('driver-5'),
      licenseNumber: 'LIC-NG-005678',
      kycStatus: KycStatus.VERIFIED,
      status: DriverStatus.ACTIVE,
      availability: DriverAvailability.AVAILABLE,
      vehicleId: id('vehicle-5'),
    },
  ];

  for (const driver of activeDrivers) {
    await prisma.driver.create({ data: driver });
  }

  // Inactive drivers
  const inactiveDrivers = [
    {
      id: id('driver-profile-6'),
      userId: id('driver-6'),
      licenseNumber: 'LIC-NG-006789',
      kycStatus: KycStatus.VERIFIED,
      status: DriverStatus.INACTIVE,
      availability: DriverAvailability.OFF_DUTY,
    },
    {
      id: id('driver-profile-7'),
      userId: id('driver-7'),
      licenseNumber: 'LIC-NG-007890',
      kycStatus: KycStatus.REJECTED,
      status: DriverStatus.SUSPENDED,
      availability: DriverAvailability.OFF_DUTY,
    },
    {
      id: id('driver-profile-8'),
      userId: id('driver-8'),
      licenseNumber: 'LIC-NG-008901',
      kycStatus: KycStatus.PENDING,
      status: DriverStatus.INACTIVE,
      availability: DriverAvailability.OFF_DUTY,
    },
  ];

  for (const driver of inactiveDrivers) {
    await prisma.driver.create({ data: driver });
  }

  console.log(`✅ Created ${activeDrivers.length} active driver profiles, ${inactiveDrivers.length} inactive driver profiles`);

  // ==================== ORDERS ====================
  console.log('📦 Creating orders...');

  const orders = [
    {
      id: id('order-1'),
      orderNumber: 'IN-ORD-2024-000001',
      clientId: id('client-1'),
      status: OrderStatus.ASSIGNED,
      totalWeight: 3500,
      priority: Priority.NORMAL,
      pickupLocation: locations.lagosMainland,
      deliveryLocation: locations.lagosIsland,
      cargoDescription: 'Industrial machinery parts',
      deliveryInstructions: 'Deliver to warehouse entrance',
      kittingStatus: KittingStatus.DISPATCH_READY,
      submittedAt: new Date(Date.now() - 86400000),
      approvedAt: new Date(Date.now() - 82800000),
    },
    {
      id: id('order-2'),
      orderNumber: 'IN-ORD-2024-000002',
      clientId: id('client-2'),
      status: OrderStatus.ASSIGNED,
      totalWeight: 8500,
      priority: Priority.HIGH,
      pickupLocation: locations.apapa,
      deliveryLocation: locations.lekki,
      cargoDescription: 'Construction materials',
      deliveryInstructions: 'Call before delivery',
      kittingStatus: KittingStatus.DISPATCH_READY,
      submittedAt: new Date(Date.now() - 43200000),
      approvedAt: new Date(Date.now() - 39600000),
    },
    {
      id: id('order-3'),
      orderNumber: 'IN-ORD-2024-000003',
      clientId: id('client-3'),
      status: OrderStatus.ASSIGNED,
      totalWeight: 2200,
      priority: Priority.NORMAL,
      pickupLocation: locations.ikeja,
      deliveryLocation: locations.surulere,
      cargoDescription: 'Electronic components',
      deliveryInstructions: 'Handle with care',
      kittingStatus: KittingStatus.DISPATCH_READY,
      submittedAt: new Date(Date.now() - 7200000),
      approvedAt: new Date(Date.now() - 3600000),
    },
    {
      id: id('order-4'),
      orderNumber: 'IN-ORD-2024-000004',
      clientId: id('client-1'),
      status: OrderStatus.ASSIGNED,
      totalWeight: 12000,
      priority: Priority.URGENT,
      pickupLocation: locations.apapa,
      deliveryLocation: locations.ajah,
      cargoDescription: 'Steel pipes',
      deliveryInstructions: 'Requires crane for unloading',
      kittingStatus: KittingStatus.DISPATCH_READY,
      submittedAt: new Date(Date.now() - 3600000),
      approvedAt: new Date(Date.now() - 1800000),
    },
    {
      id: id('order-5'),
      orderNumber: 'IN-ORD-2024-000005',
      clientId: id('client-2'),
      status: OrderStatus.DELIVERED,
      totalWeight: 4800,
      priority: Priority.NORMAL,
      pickupLocation: locations.yaba,
      deliveryLocation: locations.mushin,
      cargoDescription: 'Packaged goods',
      deliveryInstructions: 'Standard delivery',
      kittingStatus: KittingStatus.COMPLETED,
      submittedAt: new Date(Date.now() - 172800000),
      approvedAt: new Date(Date.now() - 172440000),
    },
    {
      id: id('order-6'),
      orderNumber: 'IN-ORD-2024-000006',
      clientId: id('client-3'),
      status: OrderStatus.SUBMITTED,
      totalWeight: 6500,
      priority: Priority.HIGH,
      pickupLocation: locations.ikorodu,
      deliveryLocation: locations.abuja,
      cargoDescription: 'Automotive parts',
      deliveryInstructions: 'Long distance delivery',
      kittingStatus: KittingStatus.AGGREGATION,
      submittedAt: new Date(Date.now() - 1800000),
    },
    {
      id: id('order-7'),
      orderNumber: 'IN-ORD-2024-000007',
      clientId: id('client-1'),
      status: OrderStatus.ASSIGNED,
      totalWeight: 2800,
      priority: Priority.NORMAL,
      pickupLocation: locations.festacTown,
      deliveryLocation: locations.festacTownDelivery,
      cargoDescription: 'Household goods delivery',
      deliveryInstructions: 'Deliver to F1 Close, 5th Avenue',
      kittingStatus: KittingStatus.DISPATCH_READY,
      submittedAt: new Date(Date.now() - 7200000),
      approvedAt: new Date(Date.now() - 6840000),
    },
    // Additional orders for driver1
    {
      id: id('order-8'),
      orderNumber: 'IN-ORD-2024-000008',
      clientId: id('client-1'),
      status: OrderStatus.ASSIGNED,
      totalWeight: 4200,
      priority: Priority.HIGH,
      pickupLocation: locations.surulere,
      deliveryLocation: locations.lekki,
      cargoDescription: 'Warehouse equipment',
      deliveryInstructions: 'Call 30 minutes before arrival',
      kittingStatus: KittingStatus.DISPATCH_READY,
      submittedAt: new Date(Date.now() - 3600000),
      approvedAt: new Date(Date.now() - 1800000),
    },
    {
      id: id('order-9'),
      orderNumber: 'IN-ORD-2024-000009',
      clientId: id('client-2'),
      status: OrderStatus.DELIVERED,
      totalWeight: 3100,
      priority: Priority.NORMAL,
      pickupLocation: locations.ikeja,
      deliveryLocation: locations.yaba,
      cargoDescription: 'Office furniture',
      deliveryInstructions: 'Ground floor delivery',
      kittingStatus: KittingStatus.COMPLETED,
      submittedAt: new Date(Date.now() - 259200000),
      approvedAt: new Date(Date.now() - 258840000),
    },
    {
      id: id('order-10'),
      orderNumber: 'IN-ORD-2024-000010',
      clientId: id('client-3'),
      status: OrderStatus.DELIVERED,
      totalWeight: 5500,
      priority: Priority.NORMAL,
      pickupLocation: locations.apapa,
      deliveryLocation: locations.surulere,
      cargoDescription: 'Manufacturing supplies',
      deliveryInstructions: 'Loading dock access required',
      kittingStatus: KittingStatus.COMPLETED,
      submittedAt: new Date(Date.now() - 432000000),
      approvedAt: new Date(Date.now() - 431640000),
    },
    {
      id: id('order-11'),
      orderNumber: 'IN-ORD-2024-000011',
      clientId: id('client-1'),
      status: OrderStatus.DELIVERED,
      totalWeight: 1800,
      priority: Priority.URGENT,
      pickupLocation: locations.lekki,
      deliveryLocation: locations.ikeja,
      cargoDescription: 'Medical supplies',
      deliveryInstructions: 'Temperature controlled delivery',
      kittingStatus: KittingStatus.COMPLETED,
      submittedAt: new Date(Date.now() - 604800000),
      approvedAt: new Date(Date.now() - 604440000),
    },
    {
      id: id('order-12'),
      orderNumber: 'IN-ORD-2024-000012',
      clientId: id('client-2'),
      status: OrderStatus.DELIVERED,
      totalWeight: 7200,
      priority: Priority.HIGH,
      pickupLocation: locations.mushin,
      deliveryLocation: locations.ikorodu,
      cargoDescription: 'Building materials',
      deliveryInstructions: 'Bring extra help for unloading',
      kittingStatus: KittingStatus.COMPLETED,
      submittedAt: new Date(Date.now() - 864000000),
      approvedAt: new Date(Date.now() - 863640000),
    },
  ];

  for (const order of orders) {
    await prisma.order.create({ data: order });
  }

  // Create available handling tags
  const availableTagNames = ['FRAGILE', 'HEAVY', 'CHEMICAL', 'HAZARDOUS', 'VERTICAL_STORAGE_REQUIRED', 'TEMPERATURE_SENSITIVE'];
  for (const name of availableTagNames) {
    await prisma.availableHandlingTag.create({ data: { id: id(`tag-${name}`), name } });
  }

  // Add handling tags to orders
  const orderTagMappings = [
    { orderId: id('order-1'), tagName: 'HEAVY' },
    { orderId: id('order-2'), tagName: 'HEAVY' },
    { orderId: id('order-2'), tagName: 'HAZARDOUS' },
    { orderId: id('order-3'), tagName: 'FRAGILE' },
    { orderId: id('order-3'), tagName: 'TEMPERATURE_SENSITIVE' },
    { orderId: id('order-4'), tagName: 'HEAVY' },
    { orderId: id('order-4'), tagName: 'VERTICAL_STORAGE_REQUIRED' },
    { orderId: id('order-5'), tagName: 'CHEMICAL' },
    { orderId: id('order-8'), tagName: 'HEAVY' },
    { orderId: id('order-11'), tagName: 'TEMPERATURE_SENSITIVE' },
    { orderId: id('order-11'), tagName: 'FRAGILE' },
    { orderId: id('order-12'), tagName: 'HEAVY' },
  ];

  for (const mapping of orderTagMappings) {
    await prisma.orderHandlingTag.create({
      data: {
        orderId: mapping.orderId,
        tagId: id(`tag-${mapping.tagName}`),
      },
    });
  }

  console.log(`✅ Created ${orders.length} orders with handling tags`);

  // ==================== TRIPS ====================
  console.log('🚛 Creating trips...');

  const trips = [
    {
      id: id('trip-1'),
      orderId: id('order-1'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.ASSIGNED,
      eta: new Date(Date.now() + 1800000),
    },
    {
      id: id('trip-2'),
      orderId: id('order-2'),
      driverId: id('driver-profile-2'),
      vehicleId: id('vehicle-2'),
      status: TripStatus.ASSIGNED,
      eta: new Date(Date.now() + 3600000),
    },
    {
      id: id('trip-3'),
      orderId: id('order-3'),
      driverId: id('driver-profile-3'),
      vehicleId: id('vehicle-3'),
      status: TripStatus.ASSIGNED,
      eta: new Date(Date.now() + 7200000),
    },
    {
      id: id('trip-4'),
      orderId: id('order-4'),
      driverId: id('driver-profile-4'),
      vehicleId: id('vehicle-4'),
      status: TripStatus.ASSIGNED,
      eta: new Date(Date.now() + 7200000),
    },
    {
      id: id('trip-5'),
      orderId: id('order-5'),
      driverId: id('driver-profile-5'),
      vehicleId: id('vehicle-5'),
      status: TripStatus.DELIVERED,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 72000000),
      eta: new Date(Date.now() - 75600000),
    },
    {
      id: id('trip-7'),
      orderId: id('order-7'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.ASSIGNED,
      eta: new Date(Date.now() + 5400000),
    },
    // Additional trips for driver1
    {
      id: id('trip-8'),
      orderId: id('order-8'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.ASSIGNED,
      eta: new Date(Date.now() + 5400000),
    },
    {
      id: id('trip-9'),
      orderId: id('order-9'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.DELIVERED,
      startedAt: new Date(Date.now() - 259200000),
      completedAt: new Date(Date.now() - 252000000),
      eta: new Date(Date.now() - 259200000),
    },
    {
      id: id('trip-10'),
      orderId: id('order-10'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.DELIVERED,
      startedAt: new Date(Date.now() - 432000000),
      completedAt: new Date(Date.now() - 424800000),
      eta: new Date(Date.now() - 432000000),
    },
    {
      id: id('trip-11'),
      orderId: id('order-11'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.DELIVERED,
      startedAt: new Date(Date.now() - 604800000),
      completedAt: new Date(Date.now() - 600000000),
      eta: new Date(Date.now() - 604800000),
    },
    {
      id: id('trip-12'),
      orderId: id('order-12'),
      driverId: id('driver-profile-1'),
      vehicleId: id('vehicle-1'),
      status: TripStatus.DELIVERED,
      startedAt: new Date(Date.now() - 864000000),
      completedAt: new Date(Date.now() - 856800000),
      eta: new Date(Date.now() - 864000000),
    },
  ];

  for (const trip of trips) {
    await prisma.trip.create({ data: trip });
  }

  console.log(`✅ Created ${trips.length} trips`);

  // ==================== TRACKING POINTS ====================
  console.log('📍 Creating tracking points...');

  const trackingPoints = [];

  // Trip 1 - In Transit (multiple points along route)
  const trip1Points = [
    { lat: 6.5244, lng: 3.3792, accuracy: 10, speed: 0, heading: 45, timestamp: new Date(Date.now() - 3600000) },
    { lat: 6.5300, lng: 3.3850, accuracy: 12, speed: 35, heading: 60, timestamp: new Date(Date.now() - 3000000) },
    { lat: 6.5400, lng: 3.3900, accuracy: 8, speed: 40, heading: 75, timestamp: new Date(Date.now() - 2400000) },
    { lat: 6.5500, lng: 3.3950, accuracy: 10, speed: 38, heading: 80, timestamp: new Date(Date.now() - 1800000) },
    { lat: 6.5600, lng: 3.4000, accuracy: 9, speed: 42, heading: 85, timestamp: new Date(Date.now() - 1200000) },
    { lat: 6.5700, lng: 3.4050, accuracy: 11, speed: 35, heading: 90, timestamp: new Date(Date.now() - 600000) },
    { lat: 6.5750, lng: 3.4100, accuracy: 10, speed: 30, heading: 95, timestamp: new Date() },
  ];

  for (const point of trip1Points) {
    trackingPoints.push({ ...point, tripId: id('trip-1') });
  }

  // Trip 2 - In Transit
  const trip2Points = [
    { lat: 6.4498, lng: 3.3700, accuracy: 10, speed: 0, heading: 30, timestamp: new Date(Date.now() - 7200000) },
    { lat: 6.4550, lng: 3.3800, accuracy: 12, speed: 25, heading: 45, timestamp: new Date(Date.now() - 6000000) },
    { lat: 6.4650, lng: 3.3900, accuracy: 8, speed: 30, heading: 50, timestamp: new Date(Date.now() - 4800000) },
    { lat: 6.4750, lng: 3.4000, accuracy: 10, speed: 35, heading: 55, timestamp: new Date(Date.now() - 3600000) },
    { lat: 6.4850, lng: 3.4100, accuracy: 9, speed: 32, heading: 60, timestamp: new Date(Date.now() - 2400000) },
    { lat: 6.4950, lng: 3.4150, accuracy: 11, speed: 28, heading: 65, timestamp: new Date(Date.now() - 1200000) },
    { lat: 6.5000, lng: 3.4200, accuracy: 10, speed: 25, heading: 70, timestamp: new Date() },
  ];

  for (const point of trip2Points) {
    trackingPoints.push({ ...point, tripId: id('trip-2') });
  }

  // Trip 4 - In Transit (just started)
  const trip4Points = [
    { lat: 6.4498, lng: 3.3700, accuracy: 10, speed: 0, heading: 0, timestamp: new Date(Date.now() - 1800000) },
    { lat: 6.4520, lng: 3.3750, accuracy: 12, speed: 20, heading: 40, timestamp: new Date(Date.now() - 900000) },
    { lat: 6.4550, lng: 3.3800, accuracy: 8, speed: 25, heading: 45, timestamp: new Date() },
  ];

  for (const point of trip4Points) {
    trackingPoints.push({ ...point, tripId: id('trip-4') });
  }

  // Trip 7 - Festac Town (Bode Thomas to 5th Avenue, F1 Close)
  const trip7Points = [
    { lat: 6.4650, lng: 3.2750, accuracy: 10, speed: 0, heading: 45, timestamp: new Date(Date.now() - 1800000) },
    { lat: 6.4655, lng: 3.2760, accuracy: 12, speed: 15, heading: 50, timestamp: new Date(Date.now() - 1200000) },
    { lat: 6.4660, lng: 3.2770, accuracy: 8, speed: 20, heading: 55, timestamp: new Date(Date.now() - 600000) },
    { lat: 6.4665, lng: 3.2780, accuracy: 10, speed: 18, heading: 60, timestamp: new Date(Date.now() - 300000) },
    { lat: 6.4670, lng: 3.2790, accuracy: 9, speed: 15, heading: 65, timestamp: new Date() },
  ];

  for (const point of trip7Points) {
    trackingPoints.push({ ...point, tripId: id('trip-7') });
  }

  for (const point of trackingPoints) {
    await prisma.trackingPoint.create({ data: point });
  }

  console.log(`✅ Created ${trackingPoints.length} tracking points`);

  // ==================== WEIGHT RECORDS ====================
  console.log('⚖️ Creating weight records...');

  const weightRecords = [
    {
      id: id('weight-1'),
      tripId: id('trip-1'),
      cargoWeight: 3500,
      vehicleCapacity: 5000,
      utilization: 0.7,
      status: WeightStatus.SAFE,
    },
    {
      id: id('weight-2'),
      tripId: id('trip-2'),
      cargoWeight: 8500,
      vehicleCapacity: 10000,
      utilization: 0.85,
      status: WeightStatus.WARNING,
    },
    {
      id: id('weight-3'),
      tripId: id('trip-3'),
      cargoWeight: 2200,
      vehicleCapacity: 2000,
      utilization: 1.1,
      status: WeightStatus.NEAR_CAPACITY,
    },
    {
      id: id('weight-4'),
      tripId: id('trip-4'),
      cargoWeight: 12000,
      vehicleCapacity: 15000,
      utilization: 0.8,
      status: WeightStatus.SAFE,
    },
    {
      id: id('weight-5'),
      tripId: id('trip-5'),
      cargoWeight: 4800,
      vehicleCapacity: 6000,
      utilization: 0.8,
      status: WeightStatus.SAFE,
    },
    // Additional weight records for driver1 trips
    {
      id: id('weight-8'),
      tripId: id('trip-8'),
      cargoWeight: 4200,
      vehicleCapacity: 5000,
      utilization: 0.84,
      status: WeightStatus.WARNING,
    },
    {
      id: id('weight-9'),
      tripId: id('trip-9'),
      cargoWeight: 3100,
      vehicleCapacity: 5000,
      utilization: 0.62,
      status: WeightStatus.SAFE,
    },
    {
      id: id('weight-10'),
      tripId: id('trip-10'),
      cargoWeight: 5500,
      vehicleCapacity: 5000,
      utilization: 1.1,
      status: WeightStatus.NEAR_CAPACITY,
    },
    {
      id: id('weight-11'),
      tripId: id('trip-11'),
      cargoWeight: 1800,
      vehicleCapacity: 5000,
      utilization: 0.36,
      status: WeightStatus.SAFE,
    },
    {
      id: id('weight-12'),
      tripId: id('trip-12'),
      cargoWeight: 7200,
      vehicleCapacity: 5000,
      utilization: 1.44,
      status: WeightStatus.NEAR_CAPACITY,
    },
  ];

  for (const record of weightRecords) {
    await prisma.weightRecord.create({ data: record });
  }

  console.log(`✅ Created ${weightRecords.length} weight records`);

  // ==================== GEOFENCES ====================
  console.log('🔲 Creating geofences...');

  const geofences = [
    {
      id: id('geofence-1'),
      name: 'Lagos Mainland Zone',
      type: GeofenceType.RADIUS,
      centerLat: 6.5244,
      centerLng: 3.3792,
      radiusA: 5000,
      radiusB: 10000,
      radiusC: 15000,
      radiusD: 20000,
    },
    {
      id: id('geofence-2'),
      name: 'Apapa Port Zone',
      type: GeofenceType.RADIUS,
      centerLat: 6.4498,
      centerLng: 3.3700,
      radiusA: 2000,
      radiusB: 4000,
      radiusC: 6000,
      radiusD: 8000,
    },
    {
      id: id('geofence-3'),
      name: 'Victoria Island Zone',
      type: GeofenceType.RADIUS,
      centerLat: 6.6018,
      centerLng: 3.3515,
      radiusA: 3000,
      radiusB: 6000,
      radiusC: 9000,
      radiusD: 12000,
    },
  ];

  for (const geofence of geofences) {
    await prisma.geofence.create({ data: geofence });
  }

  // ==================== GEOFENCE EVENTS ====================
  console.log('🎯 Creating geofence events...');

  const geofenceEvents = [
    {
      id: id('geofence-event-1'),
      tripId: id('trip-1'),
      geofenceId: id('geofence-1'),
      eventType: GeofenceEventType.RADIUS_A_ENTERED,
      lat: 6.5300,
      lng: 3.3850,
      triggeredAt: new Date(Date.now() - 3000000),
    },
    {
      id: id('geofence-event-2'),
      tripId: id('trip-1'),
      geofenceId: id('geofence-1'),
      eventType: GeofenceEventType.RADIUS_B_ENTERED,
      lat: 6.5400,
      lng: 3.3900,
      triggeredAt: new Date(Date.now() - 2400000),
    },
    {
      id: id('geofence-event-3'),
      tripId: id('trip-2'),
      geofenceId: id('geofence-2'),
      eventType: GeofenceEventType.RADIUS_A_ENTERED,
      lat: 6.4550,
      lng: 3.3800,
      triggeredAt: new Date(Date.now() - 6000000),
    },
    {
      id: id('geofence-event-4'),
      tripId: id('trip-2'),
      geofenceId: id('geofence-2'),
      eventType: GeofenceEventType.RADIUS_B_ENTERED,
      lat: 6.4750,
      lng: 3.4000,
      triggeredAt: new Date(Date.now() - 3600000),
    },
  ];

  for (const event of geofenceEvents) {
    await prisma.geofenceEvent.create({ data: event });
  }

  console.log(`✅ Created ${geofences.length} geofences and ${geofenceEvents.length} geofence events`);

  // ==================== POD ====================
  console.log('✍️ Creating POD records...');

  const pods = [
    {
      id: id('pod-1'),
      tripId: id('trip-5'),
      imageUrl: 'https://example.com/pod/trip-5.jpg',
      signatureUrl: 'https://example.com/signatures/trip-5.png',
      receiverName: 'John Doe',
      receiverPhone: '+2348012345678',
      notes: 'Package delivered in good condition',
      capturedAt: new Date(Date.now() - 72000000),
      lat: 6.5244,
      lng: 3.3792,
    },
    // Additional POD records for driver1's completed trips
    {
      id: id('pod-9'),
      tripId: id('trip-9'),
      imageUrl: 'https://example.com/pod/trip-9.jpg',
      signatureUrl: 'https://example.com/signatures/trip-9.png',
      receiverName: 'Adeola Johnson',
      receiverPhone: '+2348023456789',
      notes: 'Office furniture delivered successfully',
      capturedAt: new Date(Date.now() - 252000000),
      lat: 6.5244,
      lng: 3.3792,
    },
    {
      id: id('pod-10'),
      tripId: id('trip-10'),
      imageUrl: 'https://example.com/pod/trip-10.jpg',
      signatureUrl: 'https://example.com/signatures/trip-10.png',
      receiverName: 'Chukwuma Okafor',
      receiverPhone: '+2348034567890',
      notes: 'Manufacturing supplies delivered to loading dock',
      capturedAt: new Date(Date.now() - 424800000),
      lat: 6.4980,
      lng: 3.3517,
    },
    {
      id: id('pod-11'),
      tripId: id('trip-11'),
      imageUrl: 'https://example.com/pod/trip-11.jpg',
      signatureUrl: 'https://example.com/signatures/trip-11.png',
      receiverName: 'Dr. Amina Suleiman',
      receiverPhone: '+2348045678901',
      notes: 'Medical supplies delivered - temperature maintained',
      capturedAt: new Date(Date.now() - 600000000),
      lat: 6.6018,
      lng: 3.3515,
    },
    {
      id: id('pod-12'),
      tripId: id('trip-12'),
      imageUrl: 'https://example.com/pod/trip-12.jpg',
      signatureUrl: 'https://example.com/signatures/trip-12.png',
      receiverName: 'Biodun Adeleke',
      receiverPhone: '+2348056789012',
      notes: 'Building materials delivered with assistance',
      capturedAt: new Date(Date.now() - 856800000),
      lat: 6.6189,
      lng: 3.5052,
    },
  ];

  for (const pod of pods) {
    await prisma.pOD.create({ data: pod });
  }

  console.log(`✅ Created ${pods.length} POD records`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Admin Users: ${adminUsers.length}`);
  console.log(`- Client Users: ${clientUsers.length}`);
  console.log(`- Active Drivers: ${activeDriverUsers.length}`);
  console.log(`- Inactive Drivers: ${inactiveDriverUsers.length}`);
  console.log(`- Vehicles: ${vehicles.length}`);
  console.log(`- Orders: ${orders.length}`);
  console.log(`- Trips: ${trips.length}`);
  console.log(`- Tracking Points: ${trackingPoints.length}`);
  console.log(`- Weight Records: ${weightRecords.length}`);
  console.log(`- Geofences: ${geofences.length}`);
  console.log(`- Geofence Events: ${geofenceEvents.length}`);
  console.log(`- POD Records: ${pods.length}`);
  console.log('\n🔐 Test Credentials:');
  console.log('Admin: admin@industrialnexus.com / password123');
  console.log('Client: client1@company.com / password123');
  console.log('Driver: driver1@industrialnexus.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
