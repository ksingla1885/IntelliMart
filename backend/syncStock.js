require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) return;

  console.log("Synchronizing stock levels with sales...");

  // Get all bill items for this shop
  const billItems = await prisma.billItem.findMany({
    where: {
      bill: {
        shopId: shop.id,
        status: 'PAID'
      }
    }
  });

  // Map quantity sold per product
  const soldMap = {};
  billItems.forEach(item => {
    soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
  });

  // Update product stock (decrement by what was sold)
  // Note: This assumes initial stock was set, and we are correcting it.
  for (const [productId, quantity] of Object.entries(soldMap)) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      const newStock = Math.max(0, product.stock - quantity);
      await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });
      console.log(`Updated ${product.name}: stock reduced by ${quantity} to ${newStock}`);
    }
  }

  console.log("Stock synchronization complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
