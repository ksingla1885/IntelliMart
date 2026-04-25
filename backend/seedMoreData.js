require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function main() {
  // Find the first shop
  const shop = await prisma.shop.findFirst();
  
  if (!shop) {
    console.log("No shop found. Please run seedUser.js first or create a shop.");
    return;
  }

  console.log(`Using shop: ${shop.name} (${shop.id})`);

  // Define more categories
  const newCategories = [
    { name: "Bakery" },
    { name: "Dairy" },
    { name: "Stationery" },
    { name: "Home Care" },
    { name: "Personal Care" },
    { name: "Beverages" }
  ];

  const categoriesMap = {};

  for (const cat of newCategories) {
    let existingCategory = await prisma.category.findFirst({
      where: { name: cat.name, shopId: shop.id }
    });

    if (!existingCategory) {
      existingCategory = await prisma.category.create({
        data: { name: cat.name, shopId: shop.id }
      });
      console.log(`Created category: ${cat.name}`);
    } else {
      console.log(`Category exists: ${cat.name}`);
    }
    categoriesMap[cat.name] = existingCategory.id;
  }

  // Also map existing categories
  const existingCats = await prisma.category.findMany({ where: { shopId: shop.id } });
  existingCats.forEach(c => categoriesMap[c.name] = c.id);

  // Define more products
  const productsData = [
    // Bakery
    { name: "White Bread", costPrice: 25, sellingPrice: 35, stock: 40, category: "Bakery", type: "PIECES" },
    { name: "Chocolate Cake", costPrice: 400, sellingPrice: 600, stock: 5, category: "Bakery", type: "PIECES" },
    { name: "Cookies Pack", costPrice: 40, sellingPrice: 60, stock: 30, category: "Bakery", type: "PIECES" },
    
    // Dairy
    { name: "Butter 100g", costPrice: 45, sellingPrice: 55, stock: 25, category: "Dairy", type: "PIECES" },
    { name: "Cheese Slices", costPrice: 120, sellingPrice: 150, stock: 15, category: "Dairy", type: "PIECES" },
    { name: "Yogurt 400g", costPrice: 30, sellingPrice: 45, stock: 20, category: "Dairy", type: "PIECES" },

    // Beverages
    { name: "Cola 2L", costPrice: 80, sellingPrice: 95, stock: 20, category: "Beverages", type: "PIECES" },
    { name: "Orange Juice 1L", costPrice: 90, sellingPrice: 110, stock: 15, category: "Beverages", type: "PIECES" },
    { name: "Mineral Water 1L", costPrice: 12, sellingPrice: 20, stock: 100, category: "Beverages", type: "PIECES" },

    // Home Care
    { name: "Dish Soap 500ml", costPrice: 60, sellingPrice: 80, stock: 25, category: "Home Care", type: "PIECES" },
    { name: "Laundry Detergent 1kg", costPrice: 150, sellingPrice: 200, stock: 30, category: "Home Care", type: "KG" },
    { name: "Glass Cleaner", costPrice: 70, sellingPrice: 95, stock: 15, category: "Home Care", type: "PIECES" },

    // Personal Care
    { name: "Shampoo 200ml", costPrice: 120, sellingPrice: 180, stock: 40, category: "Personal Care", type: "PIECES" },
    { name: "Toothpaste 150g", costPrice: 65, sellingPrice: 90, stock: 50, category: "Personal Care", type: "PIECES" },
    { name: "Hand Wash 250ml", costPrice: 50, sellingPrice: 75, stock: 35, category: "Personal Care", type: "PIECES" },

    // Stationery
    { name: "Notebook A4", costPrice: 30, sellingPrice: 50, stock: 60, category: "Stationery", type: "PIECES" },
    { name: "Ballpoint Pen (Blue)", costPrice: 5, sellingPrice: 10, stock: 200, category: "Stationery", type: "PIECES" },
    { name: "Pencil Set", costPrice: 20, sellingPrice: 40, stock: 80, category: "Stationery", type: "PIECES" }
  ];

  for (const p of productsData) {
    const catId = categoriesMap[p.category];
    if (!catId) continue;

    // Check if product exists to avoid duplicates if run multiple times
    const existingProduct = await prisma.product.findFirst({
        where: { name: p.name, shopId: shop.id }
    });

    if (existingProduct) {
        console.log(`Product already exists: ${p.name}`);
        continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        shopId: shop.id,
        categoryId: catId,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        quantityType: p.type,
        sku: `SKU-${p.name.replace(/\s+/g, '-').toUpperCase()}`
      }
    });
    console.log(`Created product: ${p.name}`);
  }

  // More Customers
  const moreCustomers = [
    { name: "Alice Johnson", email: "alice@example.com", phone: "9876543211", address: "789 Pine Rd" },
    { name: "Bob Wilson", email: "bob@example.com", phone: "9876543212", address: "101 Oak St" },
    { name: "Charlie Brown", email: "charlie@example.com", phone: "9876543213", address: "202 Maple Dr" }
  ];

  for (const c of moreCustomers) {
    const existingCustomer = await prisma.customer.findFirst({
        where: { name: c.name, shopId: shop.id }
    });

    if (existingCustomer) {
        console.log(`Customer already exists: ${c.name}`);
        continue;
    }

    await prisma.customer.create({
      data: { ...c, shopId: shop.id }
    });
    console.log(`Created customer: ${c.name}`);
  }

  // More Suppliers
  const moreSuppliers = [
    { name: "Fresh Bakes Co.", contact_person: "Sarah Baker", email: "sarah@freshbakes.com", phone: "5550101" },
    { name: "Beverage World", contact_person: "Mike Fizz", email: "mike@bevworld.com", phone: "5550202" },
    { name: "Global Stationery", contact_person: "Jane Write", email: "jane@globalstat.com", phone: "5550303" }
  ];

  for (const s of moreSuppliers) {
    const existingSupplier = await prisma.supplier.findFirst({
        where: { name: s.name, shopId: shop.id }
    });

    if (existingSupplier) {
        console.log(`Supplier already exists: ${s.name}`);
        continue;
    }

    await prisma.supplier.create({
      data: { ...s, shopId: shop.id }
    });
    console.log(`Created supplier: ${s.name}`);
  }

  console.log("Seeding more data finished!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
