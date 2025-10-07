# Kesti POS - Phase 1 MVP

A modern, cloud-based Point of Sale (POS) system built with Next.js and Supabase.

## ⚠️ IMPORTANT: Before Starting

**If you encounter the "Invalid API key" error when creating business accounts, follow these steps:**

1. Run the setup script to configure environment variables:
   ```
   setup-env.bat
   ```

2. Restart your development server

3. If problems persist, run the full quick fix script:
   ```
   QUICK_FIX.bat
   ```

Alternatively, use the direct business creation page at `/create-business-direct`

For detailed instructions, see [ENV_SETUP.md](ENV_SETUP.md)

## 🚀 Features

### Super Admin Module
- Secure login and authentication
- Dashboard to view all business accounts
- Create new business accounts with subscription management
- Extend subscriptions by adding days
- Suspend/unsuspend accounts with a toggle

### Business User & POS Module
- Unified login for business owners and cashiers
- Automatic redirect to suspended page if subscription expired
- Core Cashier POS Interface with product grid
- Functional shopping cart (add, remove, update quantities)
- Complete sales transactions
- PIN-protected Owner Admin Panel
- Product Management (add, edit, delete products)

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Auth, RPC)
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Set Up Database

Execute the SQL schema in the Supabase SQL Editor. You can find the complete setup script in `supabase-setup.sql`.

The schema includes:
- `profiles` table for user management
- `products` table for inventory
- `sales` and `sale_items` tables for transactions
- Row Level Security (RLS) policies
- RPC functions for business logic

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Usage Guide

### For Super Admin

1. **Login**: Use your super admin credentials
2. **Create Business**: Click "Create New Business Account"
   - Enter business name, email, password, and PIN
   - Set initial subscription days
3. **Manage Subscriptions**: Click "+30 Days" to extend a subscription
4. **Suspend/Unsuspend**: Toggle account status with one click

### For Business Users

1. **Login**: Use your business credentials provided by the admin
2. **POS Screen**: 
   - Click on products to add them to cart
   - View cart by clicking the cart button
   - Adjust quantities or remove items
   - Click "Confirm Sale" to complete transaction
3. **Owner Panel**:
   - Click "Owner Panel" button
   - Enter your PIN code
   - Add, edit, or delete products

## 🗂️ Project Structure

```
kesti-pos-mvp/
├── components/          # Reusable React components
├── contexts/           # React Context providers
│   └── CartContext.tsx # Shopping cart state management
├── lib/                # Utility functions
│   └── supabase.ts     # Supabase client and types
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── owner/          # Owner-specific pages
│   ├── index.tsx       # Landing/redirect page
│   ├── login.tsx       # Login page
│   ├── pos.tsx         # POS cashier interface
│   ├── super-admin.tsx # Super admin dashboard
│   └── suspended.tsx   # Account suspended page
├── styles/             # Global styles
├── middleware.ts       # Authentication & authorization
└── supabase-setup.sql  # Database setup script
```

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- JWT-based authentication
- Middleware for route protection
- PIN protection for owner panel
- Secure API routes for user creation
- Automatic session management

## 🚧 Phase 2 Features (Coming Soon)

- Financial reporting and analytics
- Inventory tracking and alerts
- Real-time updates
- Multi-cashier support
- Receipt printing
- Customer management
- Advanced product categories

## 📄 License

This project is proprietary software for Kesti POS system.

## 🤝 Support

For support and questions, please contact your system administrator.

---

Built with ❤️ using Next.js and Supabase
