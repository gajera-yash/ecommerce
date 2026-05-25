-- MySQL Schema for Seller Dashboard
-- Database: seller_dashboard

CREATE DATABASE IF NOT EXISTS seller_dashboard;
USE seller_dashboard;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  business_name VARCHAR(200) DEFAULT 'My Business',
  currency_symbol VARCHAR(10) DEFAULT '₹',
  default_platform ENUM('AMAZON','FLIPKART') DEFAULT 'AMAZON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100),
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  mrp DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL,
  platform ENUM('AMAZON','FLIPKART') NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  category VARCHAR(100),
  quantity INT DEFAULT 1,
  sale_price DECIMAL(10,2) NOT NULL,
  my_cost_price DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  net_amount_received DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  order_date DATE NOT NULL,
  delivery_status ENUM('PENDING','SHIPPED','DELIVERED','CANCELLED','RETURNED') DEFAULT 'PENDING',
  payment_status ENUM('PAID','PENDING','REFUNDED') DEFAULT 'PENDING',
  customer_name VARCHAR(150),
  customer_city VARCHAR(100),
  customer_state VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  expense_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform fee rules table
CREATE TABLE IF NOT EXISTS platform_fee_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  platform ENUM('AMAZON','FLIPKART') NOT NULL,
  category VARCHAR(100) NOT NULL,
  fee_percentage DECIMAL(5,2) DEFAULT 0,
  fixed_fee DECIMAL(10,2) DEFAULT 0,
  effective_from DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('PRODUCT', 'EXPENSE') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_name_type (name, type)
);
