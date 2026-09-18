const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const orderNumber = process.argv[2];

async function main() {
  if (!orderNumber) {
    console.error('Usage: node getOrder.js <ORDER_NUMBER>');
    process.exit(2);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      trip: {
        include: {
          trackingPoints: { orderBy: { timestamp: 'desc' }, take: 5 },
          driver: { include: { user: true, vehicle: true } },
        },
      },
      client: true,
      handlingTags: { include: { tag: true } },
      kittingLogs: true,
      weightRecord: true,
      packageTracker: true,
      invoice: true,
    },
  });

  if (!order) {
    console.log('Order not found:', orderNumber);
    process.exit(0);
  }

  console.log(JSON.stringify(order, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error querying DB:', e.message || e);
  try { await prisma.$disconnect(); } catch (e) {}
  process.exit(1);
});
