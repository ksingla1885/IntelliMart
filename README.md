# IntelliMart

**GST-Enabled Inventory & Billing Management System for Small Retail Stores**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Docker Deployment](#-docker-deployment)
- [Future Roadmap](#-future-roadmap)
- [Security & Performance](#-security--performance)

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

### 💾 Data & Automation
- **Auto-Backups:** Scheduled database backups in Excel/JSON formats.
- **Cron Jobs:** Automated tasks for low stock monitoring and daily sales reports.
- **Export Facility:** Manual export of any data to Excel for external accounting.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | TailwindCSS + Shadcn/UI (Radix) |
| **State Management** | Redux Toolkit + React Query |
| **Backend** | Node.js + Express.js |
| **ORM** | Prisma |
| **Database** | PostgreSQL (Supabase / Local) |
| **Authentication** | JWT + OTP Verification (Email) |
| **Deployment** | Docker / Vercel |

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    User((Shop Owner)) --> Frontend[React + Shadcn UI]
    Frontend -->|API Requests| Backend[Express + Node.js]
    Backend -->|Auth| JWT[JWT + OTP Service]
    Backend -->|ORM| Prisma[Prisma ORM]
    Prisma -->|Query| DB[(PostgreSQL)]
    Backend -->|Automation| Cron[node-cron Schedulers]
    Backend -->|Files| Storage[Local/Cloud PDF & Exports]
```

---

## 📁 Project Structure

```
IntelliMart/
├── backend/
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/    # Auth & validation
│   │   ├── routes/         # API endpoints
│   │   ├── scheduler/      # Cron jobs (Backups, Alerts)
│   │   └── utils/          # Helpers (Email, PDF, Exports)
│   └── index.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (Shadcn)
│   │   ├── pages/          # Application views
│   │   ├── store/          # Redux state management
│   │   ├── hooks/          # Custom react hooks
│   │   └── integrations/   # API & Supabase clients
│   └── tailwind.config.js  # Styling configuration
└── docker-compose.yml       # Container orchestration
```

---

## 📥 Installation & Setup

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** instance
- **npm** or **pnpm**

### Step 1: Clone & Install
```bash
git clone <repository-url>
cd IntelliMart

# Install Backend
cd backend
npm install

# Install Frontend
cd ../frontend
npm install
```

### Step 2: Environment Setup
Create a `.env` in `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/intellimart"
JWT_SECRET="your_secret"
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="app-password"
```

Create a `.env` in `frontend/`:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_ANON_KEY="your_anon_key"
```

### Step 3: Database Initialize
```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## 🚀 Running the Application

### Development Mode
**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

---

## 🐳 Docker Deployment

The project includes a `docker-compose.yml` for easy orchestration.

```bash
docker-compose up --build
```
This will spin up:
- **Backend** at `http://localhost:5000`
- **Frontend** at `http://localhost:5173`
- **PostgreSQL** (if configured in compose)

---

## 🔐 Security & Performance

- **OTP Authentication:** Two-factor security for login.
- **Rate Limiting:** API protection against brute force.
- **Serverless Ready:** Backend is optimized for Vercel/Serverless deployment.
- **Lazy Loading:** Frontend uses route-based code splitting for performance.
- **Responsive:** Mobile-first design for shop floor usage.

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

This is a private project. Contributions are limited to authorized developers only.

---

## 📧 Support

For support and queries, contact the development team.

---

**IntelliMart** – Empowering small retail stores with modern, stress-free inventory and billing management.
