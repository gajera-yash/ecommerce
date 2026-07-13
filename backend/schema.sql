-- PostgreSQL Schema for Seller Dashboard

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  business_name VARCHAR(200) DEFAULT 'My Business',
  currency_symbol VARCHAR(10) DEFAULT '₹',
  default_platform VARCHAR(50) DEFAULT 'AMAZON' CHECK (default_platform IN ('AMAZON', 'FLIPKART')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100),
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  packaging_charge DECIMAL(10,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 0,
  mrp DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('AMAZON', 'FLIPKART')),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  category VARCHAR(100),
  quantity INT DEFAULT 1,
  sale_price DECIMAL(10,2) NOT NULL,
  my_cost_price DECIMAL(10,2) DEFAULT 0,
  packaging_cost DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  net_amount_received DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  order_date DATE NOT NULL,
  delivery_status VARCHAR(50) DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING','SHIPPED','DELIVERED','CANCELLED','RETURNED')),
  payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PAID','PENDING','REFUNDED')),
  gst_tcs_credit DECIMAL(10,2) DEFAULT 0,
  tds_credit DECIMAL(10,2) DEFAULT 0,
  customer_name VARCHAR(150),
  customer_city VARCHAR(100),
  customer_state VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  expense_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform fee rules table
CREATE TABLE IF NOT EXISTS platform_fee_rules (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('AMAZON', 'FLIPKART')),
  category VARCHAR(100) NOT NULL,
  fee_percentage DECIMAL(5,2) DEFAULT 0,
  fixed_fee DECIMAL(10,2) DEFAULT 0,
  effective_from DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('PRODUCT', 'EXPENSE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, type)
);
