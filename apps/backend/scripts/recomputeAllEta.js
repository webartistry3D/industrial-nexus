require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const avgSpeedKmh = Number(process.env.MAPBOX_AVG_SPEED_KMH || 40);

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
  const trips = await prisma.trip.findMany({
    where: { eta: null },
    include: { order: true },
  });

  let updated = 0;
  for (const trip of trips) {
    const order = trip.order;
    if (!order) continue;
    const pickup = order.pickupLocation;
    const delivery = order.deliveryLocation;
    if (!pickup || !delivery || typeof pickup.lat !== 'number' || typeof delivery.lat !== 'number') continue;

    const distanceMeters = haversineDistanceMeters(pickup, delivery);
    const speedMps = (avgSpeedKmh * 1000) / 3600;
    const durationSeconds = speedMps > 0 ? Math.max(30, Math.round(distanceMeters / speedMps)) : 0;
    const etaDate = new Date(Date.now() + durationSeconds * 1000);

    await prisma.trip.update({ where: { id: trip.id }, data: { eta: etaDate } });
    console.log('Set ETA for trip', trip.id, '->', etaDate.toISOString());
    updated++;
  }

  console.log('Updated trips count:', updated);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect(); } catch(e){} process.exit(1); });
