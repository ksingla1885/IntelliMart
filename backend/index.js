const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables immediately
dotenv.config();

// Routes
const authRoutes = require('./src/routes/authRoutes');
const shopRoutes = require('./src/routes/shopRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const stockMovementRoutes = require('./src/routes/stockMovementRoutes');
const billingRoutes = require('./src/routes/billingRoutes');
const reportsRoutes = require('./src/routes/reports');
const backupRoutes = require('./src/routes/backupRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const purchaseOrderRoutes = require('./src/routes/purchaseOrderRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const cronRoutes = require('./src/routes/cronRoutes');


// Schedulers
const { initializeBackupScheduler } = require('./src/scheduler/backupScheduler');
const { initializeLowStockMonitoring } = require('./src/scheduler/lowStockMonitor');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory/movements', stockMovementRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/cron', cronRoutes);


app.get('/', (req, res) => {
    res.send('MartNexus Backend is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // Only initialize schedulers in non-serverless environments
    // Vercel uses serverless functions which don't support persistent cron jobs
    const isVercel = process.env.VERCEL === '1';

    if (!isVercel) {
        console.log('Initializing schedulers...');
        initializeBackupScheduler();
        initializeLowStockMonitoring();
    } else {
        console.log('Serverless environment detected. Schedulers disabled.');
        console.log('Use /api/cron endpoints with external cron service.');
    }
});
