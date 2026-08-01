# 🛒 IntelliMart

### *GST-Enabled Inventory & Billing Management System for Small Retail Stores*

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-AGPLv3%20%2F%20Commercial-blue?style=flat-square)](file:///d:/IntelliMart/LICENSE)
[![Platform](https://img.shields.io/badge/platform-Vercel-orange?style=flat-square)](https://vercel.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone and Dependencies Installation](#step-1-clone-and-dependencies-installation)
  - [Step 2: Environment Configuration](#step-2-environment-configuration)
  - [Step 3: Database Initialization and Seeding](#step-3-database-initialization-and-seeding)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [License & Commercial Use](#-license--commercial-use)
- [Contributing & Support](#-contributing--support)

---

## 🎯 Overview

Small-scale **kirana and general-purpose stores** often struggle with manual inventory tracking, leading to inaccurate stock counts, missed updates, and high mental stress. **IntelliMart** digitizes these processes with a simple, reliable, and stress-free solution tailored for non-technical shop owners.

It provides GST-compliant billing, real-time inventory tracking, multi-shop management, and automated business analytics in a modern, responsive interface.

---

## ✨ Key Features

### 📦 Inventory & Stock Management
- **Smart Tracking:** Real-time stock updates during billing.
- **Quantity Support:** Support for Pieces, Kilograms, and Liters.
- **Stock Movements:** Detailed logs for manual adjustments, additions, and sales.
- **Low Stock Alerts:** Automated email notifications when products reach threshold levels.
- **Categorization:** Organize products into custom categories for better management.

### 🧾 Billing & Invoicing (GST Ready)
- **Flexible Taxation:** Automatic CGST/SGST/IGST calculation.
- **Invoice Generation:** Professional, printable PDF invoices.
- **Customer Profiles:** Maintain customer history and specific pricing rules.
- **Payment Modes:** Support for Cash, UPI, and Net Banking.

### 🤝 Supplier & Purchase Management
- **Supplier Directory:** Manage vendor contact details and payment terms.
- **Purchase Orders:** Create and track orders from suppliers.
- **Stock Integration:** Automatically update inventory when purchase orders are received.

### 📊 Reports & Analytics
- **Sales Insights:** Daily, monthly, and custom date-range revenue reports.
- **Profit Tracking:** Cost vs. Selling price analysis.
- **Inventory Summary:** Reports on current stock value and low-stock items.
- **Product-wise Analysis:** Identify top-selling and slow-moving products.

### 🏪 Multi-Shop Architecture
- **Centralized Ownership:** One owner account can manage multiple store locations.
- **Data Isolation:** Separate inventory, billing, and reports for each shop.
- **Quick Switcher:** Seamlessly move between shop dashboards.
- **Robust Shop Deletion:** Cascade delete capability allowing owners to securely delete shops and all linked inventory, billing, customer, and supplier data via a prominent double-confirmation warning interface.

### 💾 Data & Automation
- **Auto-Backups:** Scheduled database backups in Excel/JSON formats.
- **Cron Jobs:** Automated tasks for low stock monitoring and daily sales reports.
- **Export Facility:** Manual export of any data to Excel for external accounting.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 (TypeScript) | Fast, type-safe single-page application framework. |
| **Build Tool** | Vite | Ultra-fast local development environment and bundler. |
| **Styling** | TailwindCSS + Shadcn/UI | Modern styling utility with Radix-based customizable components. |
| **State Management** | Redux Toolkit | Centralized state management for authentication, shops, and global configuration. |
| **Data Fetching** | React Query (TanStack) | Client-side cache synchronization, pagination, and data validation hooks. |
| **Backend API** | Node.js + Express.js (v5) | Modular, RESTful backend with built-in routing and middleware logic. |
| **Database ORM** | Prisma ORM (v7.8.0) | Type-safe queries, transaction handling, and schema migrations. |
| **Database** | PostgreSQL (Supabase / Local) | Secure, relational database with transaction support and foreign key constraints. |
| **Authentication** | JWT + OTP (SMTP Email) | Two-factor verification for identity and session management. |
| **Background Tasks** | node-cron + Vercel Crons | Serverless and persistent automated reporting and database backup triggers. |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Owner((Shop Owner)) -->|Interacts| Frontend[React + Shadcn UI Client]
    Frontend -->|HTTPS API Requests| Backend[Express.js API Gateway]
    Backend -->|Verify Token / OTP| Auth[JWT & SMTP Mailer Service]
    Backend -->|Triggers Schedulers| Cron[node-cron Scheduler Module]
    Backend -->|Data Queries| Prisma[Prisma ORM Client]
    Prisma -->|Executes Transactions| DB[(PostgreSQL Database)]
    Backend -->|FileSystem I/O| Disk[Excel Exports & PDF Invoices]
    Cron -->|Daily Reporting| Auth
```

- **Frontend Client:** Connects to the backend via modular Axios interceptors that automatically attach JWT tokens.
- **Express Backend:** Enforces authentication via security middleware and route-level controllers.
- **Database Layer:** Employs a direct Prisma PG adapter connection pool with self-signed TLS verification bypass to facilitate serverless deployments.

---

## 📁 Directory Structure

```
IntelliMart/
├── backend/                       # Backend Node.js server
│   ├── prisma/                    # Prisma DB Configuration & Migrations
│   │   ├── schema.prisma          # Database schema models
│   │   └── migrations/            # SQL migration history
│   ├── src/                       
│   │   ├── controllers/           # API request handlers
│   │   ├── middleware/            # Auth & request validation middleware
│   │   ├── routes/                # Express API route endpoints
│   │   ├── scheduler/             # Cron engines for backup & monitor
│   │   ├── utils/                 # PDF generators, Excel exporters, SMTP services
│   │   └── seed-ketan.js          # DB seeder with 30-day historical data
│   ├── index.js                   # Application server entry point
│   ├── prisma.config.js           # Dynamic Prisma defineConfig setup
│   ├── vercel.json                # Vercel Serverless Function configuration
│   └── package.json               # Backend script & dependency declarations
└── frontend/                      # Frontend Vite + React client
    ├── public/                    # Static assets & icons
    ├── src/                       
    │   ├── components/            # UI components (Shadcn/UI & Radix wrappers)
    │   ├── hooks/                 # Custom React Hooks
    │   ├── integrations/          # API configurations & Supabase client integration
    │   ├── pages/                 # Full application page views
    │   └── store/                 # Redux Slices (Auth, Shops, etc.)
    ├── tailwind.config.js         # Tailwind layout configuration
    ├── vercel.json                # Vercel deployment routes mapping
    ├── vite.config.js             # Vite development server configs
    └── package.json               # Frontend dependencies & Vite scripts
```

---

## 📥 Getting Started

Follow these steps to set up a local development environment for IntelliMart.

### Prerequisites
- **Node.js** v18.x or v20.x installed.
- **PostgreSQL** instance running locally or hosted (e.g., Supabase).
- An active SMTP service credentials (e.g., Gmail App Password) for OTP mailing.

### Step 1: Clone and Dependencies Installation

Clone the repository and install dependencies in both the `backend` and `frontend` folders:

```bash
# Clone the repository
git clone <repository-url>
cd IntelliMart

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Database Connection Urls (Example for local PostgreSQL or Supabase)
DATABASE_URL="postgresql://postgres:password@localhost:5432/intellimart?sslmode=disable"
DIRECT_URL="postgresql://postgres:password@localhost:5432/intellimart?sslmode=disable"

# Application Configuration
PORT=5000
JWT_SECRET="" # Replace with a secure key
NODE_ENV="development"

# SMTP Mailer Settings
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password" # Obtain via Google Account -> App Passwords

# Frontend Mapping & Automation
FRONTEND_URL="http://localhost:3000"
CRON_SECRET="intellimart_cron_secret_2025"
BACKEND_URL="http://localhost:5000"
```
> [!NOTE]
> Review [backend/.env](file:///d:/IntelliMart/backend/.env) configuration to match your database variables.

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
VITE_SUPABASE_URL="https://your_supabase_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_anon_key"
VITE_API_URL="http://localhost:5000/api"
VITE_APP_URL="http://localhost:3000"
```
> [!NOTE]
> Review [frontend/.env](file:///d:/IntelliMart/frontend/.env) mapping.

### Step 3: Database Initialization and Seeding

Initialize the database schema and compile the Prisma client:

```bash
cd ../backend

# Generate Prisma Client
npx prisma generate

# Synchronize database tables
npx prisma db push
```

To seed the database with structured mock data (such as product categories, inventory items, vendors, and 30-day historical invoices for dashboard graphs), run:

```bash
node src/seed-ketan.js
```
> [!NOTE]
> Make sure you register an account first in the application, and update the email in [seed-ketan.js](file:///d:/IntelliMart/backend/src/seed-ketan.js) if necessary, before running the seeder.

---

## 🚀 Running the Application

### Development Mode

Run the backend server and frontend client concurrently:

**Backend API (`http://localhost:5000`):**
```bash
cd backend
npm run dev
```

**Frontend Client (`http://localhost:3000`):**
```bash
cd frontend
npm run dev
```

### Production Build

To compile static assets and run the servers in production:

**Frontend Client Build:**
```bash
cd frontend
npm run build
```

**Backend Production Run:**
```bash
cd backend
npm start
```

---

## 🔌 API Documentation

All routes expect the header `Authorization: Bearer <JWT_TOKEN>` unless they are public.

### Endpoint Overview

| Resource | Route | Method | Description | Auth Required |
| :--- | :--- | :---: | :--- | :---: |
| **Auth** | `/api/auth/register` | `POST` | Register a new owner account. | ❌ |
| **Auth** | `/api/auth/verify-otp` | `POST` | Verify registered email with OTP. | ❌ |
| **Auth** | `/api/auth/login` | `POST` | Login user, return JWT Token. | ❌ |
| **Auth** | `/api/auth/me` | `GET` | Retrieve logged-in profile. | ✅ |
| **Shops** | `/api/shops` | `POST` | Create a new shop context. | ✅ |
| **Shops** | `/api/shops` | `GET` | List all shops owned by user. | ✅ |
| **Shops** | `/api/shops/:id` | `DELETE`| Cascade delete shop & all related data. | ✅ |
| **Products**| `/api/products` | `POST` | Add a product to a shop. | ✅ |
| **Products**| `/api/products` | `GET` | Retrieve shop inventory. | ✅ |
| **Products**| `/api/products/low-stock` | `GET` | Fetch low stock products. | ✅ |
| **Billing** | `/api/billing` | `POST` | Create bill (updates stock & movements). | ✅ |
| **Billing** | `/api/billing/:id` | `GET` | Fetch invoice details. | ✅ |
| **Reports** | `/api/reports/sales-summary`| `GET` | Fetch revenue overview. | ✅ |
| **Cron** | `/api/cron/trigger-backup`| `POST` | Manually run database backup. | ✅ |

### Example Request/Response

#### 1. Login Authentication (`POST /api/auth/login`)
**Request Body:**
```json
{
  "email": "[EMAIL_ADDRESS]",
  "password": "[PASSWORD]"
}
```
**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJ...",
  "userId": ".....................",
  "name": ".......................",
  "role": "........................"
}
```

#### 2. Create Invoice (`POST /api/billing`)
**Request Body:**
```json
{
  "shopId": ".........................",
  "customerId": ".........................",
  "items": [
    {
      "productId": "........................",
      "quantity": ........................
    }
  ],
  "paymentMode": "UPI",
  "subTotal": 1000.00,
  "taxAmount": 180.00,
  "cgst": 90.00,
  "sgst": 90.00,
  "igst": 0.00,
  "totalAmount": 1180.00,
  "grandTotal": 1180.00
}
```
**Response (201 Created):**
```json
{
  "id": "........................",
  "billNumber": ".........................",
  "grandTotal": "........................",
  "createdAt": "........................",
  "status": "........................"
}
```

---

## 🧪 Testing & Quality Assurance

### Automated Testing
Automated tests can be configured via the scripts inside [package.json](file:///d:/IntelliMart/backend/package.json). Run tests locally using:
```bash
cd backend
npm run test
```

### Manual Testing & Verification Workflow

You can verify the backend API endpoints using a CLI tool like `curl`.

#### 1. Check API Health
```bash
curl http://localhost:5000/api/test
```
**Expected Response:**
`{"success":true,"message":"API is working"}`

#### 2. Verify Shop Cascade Deletion
Create a dummy shop, link products/bills, and delete it to verify the cascade constraints:
```bash
# Delete Shop Endpoint
curl -X DELETE http://localhost:5000/api/shops/<shop-id> \
  -H "Authorization: Bearer <your_jwt_token>"
```
*Verify that the corresponding records in the `Product`, `Bill`, `Customer`, and `Supplier` tables are automatically cleaned up from the database.*

---

## 📝 License & Commercial Use

This project is **Dual-Licensed**:

1. **Open Source Use:** Licensed under the [GNU Affero General Public License (AGPL) v3](file:///d:/IntelliMart/LICENSE). This version is free for personal use and for those who are willing to open-source their modifications and make them available to network users.
2. **Commercial Use:** For businesses that want to use, modify, or embed IntelliMart in a commercial context without the AGPL's copyleft restrictions, a **Commercial License** must be obtained.

For commercial licensing requests, custom feature developments, or pricing details, please reach out directly:
- **Licensing Manager:** Ketan Singla
- **Contact Email:** [heyketankumar@gmail.com](mailto:heyketankumar@gmail.com)

---

## 🤝 Contributing & Support

- **Contribution Policy:** This is a private commercial workspace. External pull requests are currently restricted. Please reach out to authorized developers for access keys.
- **Technical Support:** Report bugs, request features, or check on deployment issues by contacting the developer at [heyketankumar@gmail.com](mailto:heyketankumar@gmail.com).
