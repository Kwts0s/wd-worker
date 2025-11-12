import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DeliveryResponse } from '@/types/wolt-drive';

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'wolt-drive.db');

let db: Database.Database | null = null;

/**
 * Get or create database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH, { verbose: console.log });
    initializeTables();
  }
  return db;
}

/**
 * Initialize database tables
 */
function initializeTables() {
  if (!db) return;

  // Deliveries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wolt_order_reference_id TEXT UNIQUE,
      merchant_order_reference_id TEXT,
      venue_id TEXT,
      venue_name TEXT,
      status TEXT,
      price_amount INTEGER,
      price_currency TEXT,
      tracking_url TEXT,
      tracking_code TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      dropoff_address TEXT,
      dropoff_lat REAL,
      dropoff_lon REAL,
      pickup_address TEXT,
      pickup_lat REAL,
      pickup_lon REAL,
      created_at TEXT,
      updated_at TEXT,
      delivery_data TEXT
    )
  `);

  // Products table (mimicking Magento/CS-Cart structure)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      status TEXT DEFAULT 'active',
      stock_quantity INTEGER DEFAULT 0,
      weight_gram INTEGER,
      category TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers table (mimicking e-commerce CMS structure)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customer addresses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_addresses (
      address_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      post_code TEXT NOT NULL,
      country TEXT DEFAULT 'GR',
      is_default INTEGER DEFAULT 0,
      lat REAL,
      lon REAL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
  `);

  // Orders table (for e-shop orders)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      delivery_method TEXT,
      wolt_order_reference_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
      FOREIGN KEY (wolt_order_reference_id) REFERENCES deliveries(wolt_order_reference_id)
    )
  `);

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id),
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
  `);

  // Seed mock products if table is empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    seedMockProducts();
  }
}

/**
 * Seed mock products
 */
function seedMockProducts() {
  if (!db) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (sku, name, description, price, stock_quantity, weight_gram, category, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['LAPTOP-001', 'Premium Laptop', 'High-performance laptop with 16GB RAM', 1299.99, 10, 2500, 'Electronics', '/products/laptop.jpg'],
    ['PHONE-001', 'Smartphone Pro', 'Latest flagship smartphone', 999.99, 25, 200, 'Electronics', '/products/phone.jpg'],
    ['HEADPHONES-001', 'Wireless Headphones', 'Noise-cancelling wireless headphones', 299.99, 50, 300, 'Electronics', '/products/headphones.jpg'],
    ['BOOK-001', 'Programming Guide', 'Complete guide to modern programming', 49.99, 100, 500, 'Books', '/products/book.jpg'],
    ['TABLET-001', 'Tablet 10"', '10-inch display tablet', 599.99, 15, 600, 'Electronics', '/products/tablet.jpg'],
    ['WATCH-001', 'Smart Watch', 'Fitness tracking smart watch', 399.99, 30, 50, 'Electronics', '/products/watch.jpg'],
    ['MOUSE-001', 'Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 200, 100, 'Electronics', '/products/mouse.jpg'],
    ['KEYBOARD-001', 'Mechanical Keyboard', 'RGB mechanical gaming keyboard', 149.99, 40, 800, 'Electronics', '/products/keyboard.jpg'],
  ];

  for (const product of products) {
    insertProduct.run(...product);
  }
}

// ============ Delivery Functions ============

/**
 * Save delivery to database
 */
export function saveDelivery(delivery: DeliveryResponse): number {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO deliveries (
      wolt_order_reference_id,
      merchant_order_reference_id,
      venue_id,
      venue_name,
      status,
      price_amount,
      price_currency,
      tracking_url,
      tracking_code,
      customer_name,
      customer_phone,
      customer_email,
      dropoff_address,
      dropoff_lat,
      dropoff_lon,
      pickup_address,
      pickup_lat,
      pickup_lon,
      created_at,
      updated_at,
      delivery_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wolt_order_reference_id) DO UPDATE SET
      status = excluded.status,
      tracking_url = excluded.tracking_url,
      updated_at = excluded.updated_at,
      delivery_data = excluded.delivery_data
  `);

  const result = stmt.run(
    delivery.wolt_order_reference_id,
    delivery.merchant_order_reference_id,
    delivery.pickup?.location?.formatted_address || '',
    delivery.pickup?.display_name || '',
    delivery.status,
    delivery.price?.amount || 0,
    delivery.price?.currency || 'EUR',
    delivery.tracking?.url || '',
    delivery.tracking?.id || '',
    delivery.recipient?.name || '',
    delivery.recipient?.phone_number || '',
    delivery.recipient?.email || '',
    delivery.dropoff?.location?.formatted_address || '',
    delivery.dropoff?.location?.coordinates?.lat || null,
    delivery.dropoff?.location?.coordinates?.lon || null,
    delivery.pickup?.location?.formatted_address || '',
    delivery.pickup?.location?.coordinates?.lat || null,
    delivery.pickup?.location?.coordinates?.lon || null,
    delivery.created_at || new Date().toISOString(),
    new Date().toISOString(),
    JSON.stringify(delivery)
  );

  return result.lastInsertRowid as number;
}

/**
 * Get all deliveries
 */
export function getAllDeliveries(): Array<{
  id: number;
  wolt_order_reference_id: string;
  merchant_order_reference_id: string;
  venue_name: string;
  status: string;
  price_amount: number;
  price_currency: string;
  tracking_url: string;
  customer_name: string;
  dropoff_address: string;
  created_at: string;
}> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      id,
      wolt_order_reference_id,
      merchant_order_reference_id,
      venue_name,
      status,
      price_amount,
      price_currency,
      tracking_url,
      customer_name,
      dropoff_address,
      created_at
    FROM deliveries
    ORDER BY created_at DESC
  `);
  
  return stmt.all() as Array<{
    id: number;
    wolt_order_reference_id: string;
    merchant_order_reference_id: string;
    venue_name: string;
    status: string;
    price_amount: number;
    price_currency: string;
    tracking_url: string;
    customer_name: string;
    dropoff_address: string;
    created_at: string;
  }>;
}

/**
 * Update delivery status
 */
export function updateDeliveryStatus(woltOrderReferenceId: string, status: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE deliveries 
    SET status = ?, updated_at = ? 
    WHERE wolt_order_reference_id = ?
  `);
  stmt.run(status, new Date().toISOString(), woltOrderReferenceId);
}

// ============ Product Functions ============

/**
 * Get all products
 */
export function getAllProducts(): Array<{
  product_id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  weight_gram: number;
  category: string;
  image_url: string;
}> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      product_id,
      sku,
      name,
      description,
      price,
      stock_quantity,
      weight_gram,
      category,
      image_url
    FROM products
    WHERE status = 'active'
    ORDER BY name
  `);
  
  return stmt.all() as Array<{
    product_id: number;
    sku: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    weight_gram: number;
    category: string;
    image_url: string;
  }>;
}

/**
 * Get product by ID
 */
export function getProductById(productId: number): {
  product_id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  weight_gram: number;
  category: string;
  image_url: string;
} | undefined {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      product_id,
      sku,
      name,
      description,
      price,
      stock_quantity,
      weight_gram,
      category,
      image_url
    FROM products
    WHERE product_id = ?
  `);
  
  return stmt.get(productId) as {
    product_id: number;
    sku: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    weight_gram: number;
    category: string;
    image_url: string;
  } | undefined;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
