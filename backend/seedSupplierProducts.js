require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) return;

  console.log("Linking products to suppliers...");

  const suppliers = await prisma.supplier.findMany({ where: { shopId: shop.id } });
  const products = await prisma.product.findMany({ where: { shopId: shop.id } });

  for (const supplier of suppliers) {
    // Link about 5-10 random products to each supplier
    const randomProducts = products.sort(() => 0.5 - Math.random()).slice(0, 8);
    
    for (const product of randomProducts) {
      try {
        await prisma.supplierProduct.upsert({
          where: {
            supplierId_productId: {
              supplierId: supplier.id,
              productId: product.id
            }
          },
          update: {},
          create: {
            supplierId: supplier.id,
            productId: product.id,
            costPrice: product.costPrice || 0,
            supplierSku: `SUP-${product.sku}`,
            isPreferred: Math.random() > 0.5
          }
        });
        console.log(`Linked ${product.name} to ${supplier.name}`);
      } catch (e) {
        // Skip if already exists or other error
      }
    }
  }

  console.log("Supplier-Product linking complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
