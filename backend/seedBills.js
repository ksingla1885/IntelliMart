require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function main() {
  // Find the first shop
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.log("No shop found. Please seed a shop first.");
    return;
  }

  const products = await prisma.product.findMany({ where: { shopId: shop.id } });
  const customers = await prisma.customer.findMany({ where: { shopId: shop.id } });

  if (products.length === 0) {
    console.log("No products found. Please seed products first.");
    return;
  }

  console.log(`Seeding sample bills for shop: ${shop.name} (${shop.id})`);

  // Create 25 sample bills over the last 30 days
  for (let i = 1; i <= 25; i++) {
    const customer = customers.length > 0 && Math.random() > 0.2 ? customers[Math.floor(Math.random() * customers.length)] : null;
    
    const billDate = new Date();
    billDate.setDate(billDate.getDate() - Math.floor(Math.random() * 30));
    billDate.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60)); // Random time between 9 AM and 9 PM

    // Select 1 to 4 unique products for the bill
    const numUniqueItems = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = [];
    const tempProducts = [...products];
    for (let k = 0; k < numUniqueItems && tempProducts.length > 0; k++) {
      const idx = Math.floor(Math.random() * tempProducts.length);
      selectedProducts.push(tempProducts.splice(idx, 1)[0]);
    }

    const items = [];
    let subTotal = 0;

    for (const product of selectedProducts) {
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = Number(product.sellingPrice);
      const taxRate = 0.18; // Assuming 18% GST
      const taxAmount = price * quantity * taxRate;
      
      items.push({
        productId: product.id,
        quantity: quantity,
        price: price,
        taxAmount: taxAmount
      });
      subTotal += price * quantity;
    }

    const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const grandTotal = subTotal + totalTax;

    await prisma.bill.create({
      data: {
        shopId: shop.id,
        customerId: customer ? customer.id : null,
        billNumber: `BILL-${1000 + i}`,
        customerName: customer ? customer.name : "Guest Customer",
        customerMobile: customer ? customer.phone : "0000000000",
        customerFirm: customer ? "Individual" : null,
        subTotal: subTotal,
        taxAmount: totalTax,
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        igst: 0,
        grandTotal: grandTotal,
        totalAmount: grandTotal,
        status: "PAID",
        paymentMode: Math.random() > 0.5 ? "CASH" : "UPI",
        createdAt: billDate,
        updatedAt: billDate,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            taxAmount: item.taxAmount
          }))
        }
      }
    });
    console.log(`Created sample bill ${i}/${25}: ${grandTotal.toFixed(2)}`);
  }

  console.log("Successfully seeded 25 sample bills!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
