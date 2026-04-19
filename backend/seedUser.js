require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function main() {
  const userId = 'b1a2f406-e3ce-4bab-b339-416a00bc7923';

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.log(`User with ID ${userId} not found in database. Cannot seed data.`);
    console.log('You might need to create the user first, or verify the ID.');
    return;
  }

  console.log(`Found user: ${user.email}. Seeding data...`);

  // Create a shop for the user
  const shop = await prisma.shop.create({
    data: {
      name: "My Awesome Mart",
      ownerId: userId,
      address: "123 Main St, City, Country",
      gstin: "22AAAAA0000A1Z5",
      mobile: "9876543210"
    }
  });
  console.log(`Created shop: ${shop.name} with ID ${shop.id}`);

  // Create some categories
  const categoriesData = [
    { name: "Electronics" },
    { name: "Groceries" },
    { name: "Clothing" }
  ];

  const categories = [];
  for (const catData of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        shopId: shop.id
      }
    });
    categories.push(category);
    console.log(`Created category: ${category.name}`);
  }

  // Create some products
  const productsData = [
    { name: "Laptop", costPrice: 50000, sellingPrice: 60000, stock: 10, categoryId: categories[0].id, quantityType: "PIECES" },
    { name: "Rice 5kg", costPrice: 300, sellingPrice: 350, stock: 50, categoryId: categories[1].id, quantityType: "KG" },
    { name: "T-Shirt", costPrice: 200, sellingPrice: 500, stock: 100, categoryId: categories[2].id, quantityType: "PIECES" },
    { name: "Milk 1L", costPrice: 50, sellingPrice: 60, stock: 20, categoryId: categories[1].id, quantityType: "LITERS" },
    { name: "Smartphone", costPrice: 15000, sellingPrice: 20000, stock: 25, categoryId: categories[0].id, quantityType: "PIECES" }
  ];

  for (const prodData of productsData) {
    const product = await prisma.product.create({
      data: {
        name: prodData.name,
        shopId: shop.id,
        costPrice: prodData.costPrice,
        sellingPrice: prodData.sellingPrice,
        stock: prodData.stock,
        categoryId: prodData.categoryId,
        quantityType: prodData.quantityType
      }
    });
    console.log(`Created product: ${product.name}`);
  }

  // Create some suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      shopId: shop.id,
      name: "Tech Wholesalers",
      contact_person: "Bob Smith",
      email: "bob@techwholesalers.com",
      phone: "1112223333"
    }
  });
  console.log(`Created supplier: ${supplier1.name}`);

  // Create a customer
  const customer = await prisma.customer.create({
    data: {
      shopId: shop.id,
      name: "John Doe",
      email: "johndoe@example.com",
      phone: "1234567890",
      address: "456 Elm St, Town"
    }
  });
  console.log(`Created customer: ${customer.name}`);

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
