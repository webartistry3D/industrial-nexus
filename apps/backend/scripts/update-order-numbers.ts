import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateOrderNumbers() {
  console.log('🔄 Starting order number format update...');
  console.log('📋 Converting from ORD-YYYY-XXXXXX to IN-ORD-YYYY-XXXXXX\n');

  try {
    // Fetch all orders that need updating
    const ordersToUpdate = await prisma.order.findMany({
      where: {
        orderNumber: {
          startsWith: 'ORD-',
        },
        AND: {
          orderNumber: {
            not: {
              startsWith: 'IN-ORD-',
            },
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
      },
    });

    if (ordersToUpdate.length === 0) {
      console.log('✅ No orders need updating. All orders already use the new format.');
      return;
    }

    console.log(`📊 Found ${ordersToUpdate.length} orders to update:\n`);

    // Display orders to be updated
    ordersToUpdate.forEach((order, index) => {
      const newOrderNumber = order.orderNumber.replace('ORD-', 'IN-ORD-');
      console.log(`  ${index + 1}. ${order.orderNumber} → ${newOrderNumber}`);
    });

    console.log('\n⚠️  This will permanently update order numbers in the database.');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');

    // Update each order
    const updatePromises = ordersToUpdate.map(async (order) => {
      const newOrderNumber = order.orderNumber.replace('ORD-', 'IN-ORD-');
      return prisma.order.update({
        where: { id: order.id },
        data: { orderNumber: newOrderNumber },
      });
    });

    await Promise.all(updatePromises);

    console.log(`\n✅ Successfully updated ${ordersToUpdate.length} order numbers!`);
    console.log('🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error updating order numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
updateOrderNumbers()
  .then(() => {
    console.log('✨ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
