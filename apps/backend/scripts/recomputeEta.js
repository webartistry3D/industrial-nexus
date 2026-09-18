require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orderNumber = process.argv[2];
const avgSpeedKmh = Number(process.env.MAPBOX_AVG_SPEED_KMH || 40);

if (!orderNumber) {
  console.error('Usage: node recomputeEta.js <ORDER_NUMBER>');
  process.exit(2);
}

function toRad(v) { return (v * Math.PI) / 180; }

function haversineDistanceMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const aa = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*(Math.sin(dLon/2)**2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
  return Math.round(R * c);
}

async function main() {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    console.error('Order not found:', orderNumber);
    process.exit(1);
  }

  const pickup = order.pickupLocation;
  const delivery = order.deliveryLocation;
  if (!pickup || !delivery || typeof pickup.lat !== 'number' || typeof delivery.lat !== 'number') {
    console.error('Order missing pickup/delivery coordinates');
    process.exit(1);
  }

  const distanceMeters = haversineDistanceMeters(pickup, delivery);
  const speedMps = (avgSpeedKmh * 1000) / 3600;
  const durationSeconds = speedMps > 0 ? Math.max(30, Math.round(distanceMeters / speedMps)) : 0;
  const etaDate = new Date(Date.now() + durationSeconds * 1000);

  const trip = await prisma.trip.findFirst({ where: { orderId: order.id } });
  if (!trip) {
    console.error('Trip not found for order:', order.id);
    process.exit(1);
  }

  const updated = await prisma.trip.update({ where: { id: trip.id }, data: { eta: etaDate } });
  console.log('Updated trip', updated.id, 'eta ->', updated.eta);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect(); } catch(e){} process.exit(1); });
