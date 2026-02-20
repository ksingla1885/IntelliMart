const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Force bypass TLS verification for self-signed certificates (often needed with Supabase in some environments)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


// Initialize the pg Pool with your connection string and SSL configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Create the Prisma adapter using the pool
const adapter = new PrismaPg(pool);


// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
