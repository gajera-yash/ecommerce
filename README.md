# Seller Dashboard - Order & Revenue Management System

Full-stack Order & Revenue Management System for Amazon/Flipkart sellers.

## Tech Stack
- **Frontend:** React.js (Vite) + Ant Design + Recharts
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Auth:** JWT-based

## Quick Setup

### 1. Database
```sql
-- Run in MySQL
source backend/schema.sql
```

### 2. Backend
```bash
cd backend
# Edit backend/.env with your MySQL credentials (already created)
npm install
npm run seed          # Seed sample data
npm run dev           # Starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:5173
```

### Login Credentials
- **Email:** admin@business.com
- **Password:** Admin@123

## Features
- **Dashboard** - Today's stats, revenue trends, platform split charts, top products
- **Orders** - Full CRUD, search, filter, sort, pagination, bulk status update, profit breakdown
- **Products** - Catalog management with low stock alerts
- **Revenue** - Per-order profit breakdown, monthly summary, margin tracking
- **Reports** - Platform-wise, product-wise, monthly P&L, CSV export
- **Expenses** - Track miscellaneous expenses by category
- **Settings** - Profile management, platform fee rules configuration

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=seller_dashboard
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/orders | List orders (with filters) |
| POST | /api/orders | Create order |
| PUT | /api/orders/:id | Update order |
| DELETE | /api/orders/:id | Delete order |
| PATCH | /api/orders/bulk-status | Bulk status update |
| GET/POST/PUT/DELETE | /api/products | Product CRUD |
| GET/POST/PUT/DELETE | /api/expenses | Expense CRUD |
| GET | /api/dashboard/summary | Dashboard stats |
| GET | /api/dashboard/charts | Chart data |
| GET | /api/reports/platform | Platform report |
| GET | /api/reports/products | Product report |
| GET | /api/reports/monthly-pnl | Monthly P&L |
| GET | /api/reports/export-csv | Export CSV |
| GET/PUT | /api/settings/profile | Profile |
| GET/POST/PUT/DELETE | /api/settings/fee-rules | Fee rules |
