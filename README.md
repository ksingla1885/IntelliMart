# IntelliMart

**GST-Enabled Inventory & Billing Management System for Small Retail Stores**

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Target Users](#-target-users)
- [Core Objectives](#-core-objectives)
- [Technology Stack](#️-technology-stack)
- [User Interface & Experience](#-user-interface--experience)
- [User Roles](#-user-roles)
- [Inventory Management Module](#-inventory-management-module)
- [Billing & Invoicing Module](#-billing--invoicing-module)
- [Reports & Analytics](#-reports--analytics)
- [Data Backup & Export](#-data-backup--export)
- [Multi-Shop Management](#-multi-shop-management)
- [Notifications](#-notifications)
- [Security Requirements](#-security-requirements)
- [Architecture Overview](#️-architecture-overview)
- [Development Scope](#-development-scope)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)

---

## 🎯 Problem Statement

Small-scale **kirana and general-purpose stores** in small towns rely on manual notebooks and registers for inventory tracking. This leads to:

- ❌ Inaccurate stock counts
- ❌ Missed updates
- ❌ High mental stress for shop owners
- ❌ Difficulty managing per-item quantities
- ❌ No real-time visibility of remaining stock
- ❌ Poor billing and reporting practices

**IntelliMart** aims to digitize inventory, billing, and reporting in a way that is **simple, reliable, stress-free, and scalable** for small business owners.

---

## 👥 Target Users

**Primary User:** Shop Owner (non-technical)

**Business Type:**
- Kirana / general stores
- Small town / street retail shops

---

## 🎯 Core Objectives

✅ Simplify inventory management  
✅ Track per-item stock accurately  
✅ Reduce dependency on manual registers  
✅ Provide GST-compliant billing  
✅ Generate meaningful business reports  
✅ Enable multi-shop ownership  
✅ Prepare foundation for future scaling  

---

## 🛠️ Technology Stack (Fixed)

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB |
| **Authentication** | Email + Password, OTP verification (email-based) |
| **Deployment** | Localhost (Phase-1) |

---

## 🎨 User Interface & Experience

✨ **Clean, modern, and advanced UI**  
✨ **Large, readable buttons**  
✨ **Extremely easy to use** for non-technical users  
✨ **Fully responsive:**
   - Desktop
   - Tablet
   - Mobile

✨ **Unique branding** (not a generic admin panel)

---

## 👤 User Roles

### Phase-1
- **Owner only**

### Future Scope
- Cashier role

---

## 📦 Inventory Management Module

### Product Fields

| Field | Description |
|-------|-------------|
| **Product name** | Name of the product |
| **Quantity type** | Pieces / Kilograms |
| **Cost price** | Purchase price |
| **Selling price** | Retail price |

### Inventory Features

✅ Manual stock increase/decrease by owner  
✅ Automatic stock update during billing  
✅ Per-item stock tracking  
✅ Low stock threshold per product  
✅ **Email alerts** when stock reaches end-point  

---

## 🧾 Billing & Invoicing Module (GST Ready)

### Billing

✅ **GST-based billing:**
   - CGST / SGST / IGST
   - Automatic tax calculation

✅ Unique bill number generation  
✅ Stock auto-deduction during billing  

### Invoice

✅ Printable invoice  
✅ Auto-saved bills  
✅ Downloadable PDF format  

### Customer Data

**Store:**
- Bill number
- Customer name (existing or new)
- No mandatory phone/email required

### Payment Modes

- 💵 Cash
- 📱 UPI
- 🏦 Net Banking

---

## 📊 Reports & Analytics

### Sales Reports

- Daily
- Monthly
- Custom date range

### Inventory Reports

- Current stock summary
- Low stock items

### Time-based Views

- Today
- Last 7 days
- Last 15 days
- Monthly
- Custom range

### Report Details

| Metric | Description |
|--------|-------------|
| **Product-wise sales** | Sales breakdown by product |
| **Quantity sold** | Total units sold |
| **Remaining stock** | Current inventory levels |
| **Revenue** | Total sales revenue |
| **GST collected** | Total GST amount |
| **Profit** | Cost vs selling price analysis |

---

## 💾 Data Backup & Export

✅ **Automatic data backup** every 7 days  
✅ **Auto-export data** in Excel format  
✅ **Manual export option** for owner  

---

## 🏪 Multi-Shop Management

✅ One owner can manage **multiple shops**  
✅ **Separate:**
   - Inventory
   - Billing
   - Reports per shop

✅ **Shop switcher** from dashboard  

---

## 🔔 Notifications

### Phase-1

**Email alerts:**
- Low stock notifications
- Backup/export confirmation

---

## 🔐 Security Requirements

✅ Email + password authentication  
✅ OTP verification during login  
✅ Secure password hashing  
✅ JWT-based session management  
✅ Protected APIs  

---

## 🏗️ Architecture Overview (HLD)

```
React Frontend
      ↓
Node.js + Express APIs
      ↓
MongoDB Database
```

### Modules

1. **Authentication Service**
2. **Inventory Service**
3. **Billing Service**
4. **Reporting Service**
5. **Notification Service**

---

## 🚀 Development Scope

### ✅ Included in Phase-1

- Online-only system
- Localhost deployment
- Full GST billing
- Reports & exports

### 🔮 Explicit Future Scope

- Offline-first functionality with auto-sync
- WhatsApp / SMS alerts
- Cashier role
- Supplier & purchase management
- Cloud deployment
- Mobile app (React Native)

---

## 📥 Installation & Setup

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** installed and running
- **npm** or **yarn** package manager

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd IntelliMart
   ```

2. **Install Backend Dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/intellimart
   JWT_SECRET=your_jwt_secret_key
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   ```

5. **Set up MongoDB**

   Ensure MongoDB is running on your system:

   ```bash
   mongod
   ```

---

## 🚀 Running the Application

### Development Mode

1. **Start Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

   Backend runs at: `http://localhost:5000`

2. **Start Frontend Development Server**

   ```bash
   cd frontend
   npm run dev
   ```

   Frontend runs at: `http://localhost:5173`

### Production Build

1. **Build Frontend**

   ```bash
   cd frontend
   npm run build
   ```

2. **Start Production Server**

   ```bash
   cd backend
   npm start
   ```

---

## 📁 Project Structure

```
IntelliMart/
├── backend/
│   ├── controllers/      # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── services/        # Email, notifications
│   ├── config/          # Configuration files
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API calls
│   │   ├── utils/       # Utilities
│   │   ├── context/     # Context providers
│   │   └── App.jsx      # Root component
│   └── public/          # Static assets
└── README.md
```

---

## 📝 License

This project is **private and proprietary**. Unauthorized use or distribution is prohibited.

---

## 🤝 Contributing

This is a private project. Contributions are limited to authorized developers only.

---

## 📧 Support

For support and queries, contact the development team.

---

**IntelliMart** – Empowering small retail stores with modern, stress-free inventory and billing management.
