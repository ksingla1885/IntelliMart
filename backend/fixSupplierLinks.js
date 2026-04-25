require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) return;

  const techWholesaler = await prisma.supplier.findFirst({
    where: { name: 'Tech Wholesalers', shopId: shop.id }
  });

  if (!techWholesaler) {
    console.log("Tech Wholesalers not found");
    return;
  }

  // Ensure these products are linked to Tech Wholesalers
  const productNames = ['Laptop', 'Smartphone', 'Mobile Cover', 'T-Shirt', 'Chocolate Cake', 'Cheese Slices'];
  
  for (const name of productNames) {
    const product = await prisma.product.findFirst({
        where: { name, shopId: shop.id }
    });

    if (product) {
      await prisma.supplierProduct.upsert({
        where: {
          supplierId_productId: {
            supplierId: techWholesaler.id,
            productId: product.id
          }
        },
        update: {},
        create: {
          supplierId: techWholesaler.id,
          productId: product.id,
          costPrice: product.costPrice || 0,
          supplierSku: `SUP-${product.sku}`,
          isPreferred: true
        }
      });
      console.log(`Linked ${name} to Tech Wholesalers`);
    }
  }

  console.log("Strategic linking complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
