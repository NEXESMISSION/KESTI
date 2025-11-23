# KESTI POS - Database Schema Documentation

**Version:** 2.0  
**Last Updated:** November 2025

## Overview

This document describes the complete database schema for the KESTI POS system.

---

## Tables

### 1. **profiles**

Stores user account information and settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | - | Primary key, references auth.users |
| `full_name` | TEXT | Yes | NULL | User's full name |
| `email` | TEXT | No | - | User's email (unique) |
| `phone_number` | TEXT | Yes | NULL | User's phone number |
| `role` | user_role | No | 'business_user' | User role (super_admin or business_user) |
| `subscription_ends_at` | TIMESTAMPTZ | Yes | NULL | Subscription expiration date |
| `is_suspended` | BOOLEAN | No | FALSE | Account suspension status |
| `suspension_message` | TEXT | Yes | NULL | Message shown to suspended users |
| `pin_code` | TEXT | Yes | NULL | PIN for accessing owner features |
| `history_auto_clear_days` | INTEGER | Yes | NULL | Days between auto history clears |
| `history_auto_clear_minutes` | INTEGER | Yes | NULL | Minutes between clears (testing only) |
| `last_history_clear` | TIMESTAMPTZ | Yes | NULL | Last history clear timestamp |
| `created_at` | TIMESTAMPTZ | No | NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |

**Auto-Clear Feature:**
- Set `history_auto_clear_days` for production (e.g., 30, 90, 180 days)
- Set `history_auto_clear_minutes` for testing only (overrides days)
- `last_history_clear` tracks when history was last cleared
- Alert shows 3 days before auto-clear triggers

---

### 2. **product_categories**

Product categories for organization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `owner_id` | UUID | No | - | References auth.users (CASCADE) |
| `name` | TEXT | No | - | Category name |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |

**Unique Constraint:** (owner_id, name)

---

### 3. **products**

Product inventory and pricing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `owner_id` | UUID | No | - | References auth.users (CASCADE) |
| `name` | TEXT | No | - | Product name |
| `selling_price` | NUMERIC | No | - | Selling price (≥ 0) |
| `cost_price` | NUMERIC | No | 0 | Cost price (≥ 0) |
| `category_id` | UUID | Yes | NULL | References product_categories |
| `barcode` | TEXT | Yes | NULL | Barcode for scanning |
| `image_url` | TEXT | Yes | NULL | Product image URL |
| `unit_type` | TEXT | No | 'item' | Unit type (item, kg, liter, etc.) |
| `stock_quantity` | NUMERIC | Yes | NULL | Current stock quantity |
| `low_stock_threshold` | NUMERIC | No | 10 | Low stock alert threshold |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |

---

### 4. **sales**

Sales transactions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `owner_id` | UUID | No | - | References auth.users (CASCADE) |
| `total_amount` | NUMERIC | No | - | Total sale amount (≥ 0) |
| `payment_method` | TEXT | No | 'cash' | Payment method |
| `created_at` | TIMESTAMPTZ | No | NOW() | Sale timestamp |

---

### 5. **sale_items**

Individual items within sales.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | BIGSERIAL | No | AUTO | Primary key |
| `sale_id` | UUID | No | - | References sales (CASCADE) |
| `product_id` | UUID | Yes | NULL | References products (SET NULL) |
| `product_name` | TEXT | No | - | Product name at time of sale |
| `quantity` | NUMERIC | No | - | Quantity sold (> 0) |
| `price_at_sale` | NUMERIC | No | - | Price at time of sale (≥ 0) |
| `cost_price_at_sale` | NUMERIC | No | 0 | Cost price at time of sale (≥ 0) |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |

---

### 6. **expenses**

Business expenses tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `owner_id` | UUID | No | - | References auth.users (CASCADE) |
| `description` | TEXT | No | - | Expense description |
| `amount` | NUMERIC | No | - | Expense amount (≥ 0) |
| `category` | TEXT | Yes | NULL | Expense category |
| `expense_type` | TEXT | No | - | 'one_time' or 'recurring' |
| `recurring_frequency` | TEXT | Yes | NULL | 'daily', 'weekly', 'monthly', 'yearly' |
| `next_occurrence_date` | DATE | Yes | NULL | Next occurrence for recurring |
| `is_active` | BOOLEAN | No | TRUE | Active status for recurring |
| `created_at` | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | NOW() | Last update timestamp |

---

## Enums

### **user_role**

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'business_user');
```

- **super_admin**: Full system access, can manage all businesses
- **business_user**: Normal business owner, accesses own data only

---

## Functions

### **is_super_admin()**

```sql
RETURNS BOOLEAN
```

Checks if the current user is a super admin.

---

### **create_sale(sale_total NUMERIC, items JSONB)**

```sql
RETURNS UUID
```

Creates a sale with items atomically. Returns sale ID.

**Parameters:**
- `sale_total`: Total amount for the sale
- `items`: JSON array of sale items

---

### **verify_business_pin(input_pin TEXT)**

```sql
RETURNS BOOLEAN
```

Verifies the user's PIN code.

**Parameters:**
- `input_pin`: PIN to verify

---

## Triggers

### **on_auth_user_created**

Automatically creates a profile when a new user signs up.

```sql
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user()
```

---

## Row Level Security (RLS)

All tables have RLS enabled with policies:

### **Profiles:**
- Super admins: Full access
- Business users: Own profile only

### **Products/Categories:**
- Owner: Full access to own data
- Others: No access

### **Sales/Sale Items:**
- Owner: Full access to own sales
- Others: No access

### **Expenses:**
- Owner: Full access to own expenses
- Others: No access

---

## Indexes

Performance indexes on:
- `products(owner_id)`
- `products(barcode)`
- `sales(owner_id, created_at)`
- `sale_items(sale_id)`
- `expenses(owner_id, created_at)`

---

## Auto-Clear History Feature

### How It Works:

1. **Configuration:**
   - Set `history_auto_clear_days` (e.g., 30, 90, 180)
   - Or set `history_auto_clear_minutes` for testing

2. **Automatic Clearing:**
   - Daily cron job runs at midnight
   - Checks all users with auto-clear enabled
   - Deletes expired sales & expenses
   - Updates `last_history_clear`

3. **User Warnings:**
   - Alert shows when < 3 days remain
   - Popup reminds every hour (can dismiss)
   - Bell icon shows alert count

4. **What's Cleared:**
   - ❌ Sales transactions
   - ❌ Sale items
   - ❌ Expenses

5. **What's Kept:**
   - ✅ Products
   - ✅ Categories
   - ✅ Profile settings
   - ✅ Saved templates (localStorage)

---

## Setup Scripts Order

1. **1_COMPLETE_RESET_AND_SETUP.sql** - Full database setup (includes auto-clear)
2. **2_SETUP_STORAGE.sql** - Product image storage
3. **3_CREATE_SUPER_ADMIN.sql** - First admin user
4. **4_ADD_HISTORY_AUTO_CLEAR.sql** - Only if upgrading old database
5. **5_ADD_PHONE_NUMBER.sql** - Add phone number field (run if upgrading existing database)

---

## Connection Info

- **Framework:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (product-images bucket)
- **RLS:** Enabled on all tables

---

## API Endpoints

### **POST /api/check-and-auto-clear**

Checks all users and auto-clears expired histories.

**Called by:**
- Vercel cron (daily at midnight)
- Page loads (POS/Finance)

---

## Best Practices

1. **Always use service role key** for admin operations
2. **Enable RLS** on all tables
3. **Set auto-clear days** based on legal requirements
4. **Test with minutes** before using days in production
5. **Backup before** running reset scripts
6. **Users should download data** before auto-clear

---

## Version History

- **v2.0** (Nov 2025): Added auto-clear history feature
- **v1.0** (Initial): Basic POS schema

---

For more information, see the `/scripts/README.md` file.
