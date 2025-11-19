# KESTI POS System

Modern Point of Sale (POS) system built with Next.js, React, TypeScript, and Supabase.

## 🚀 Features

- **Point of Sale**: Fast checkout with product search, barcode scanning
- **Inventory Management**: Stock tracking with low stock alerts
- **Financial Analytics**: Revenue, expenses, and profit tracking
- **Super Admin Dashboard**: Manage business accounts and subscriptions
- **History & Reports**: Sales and expenses history with export to CSV
- **Auto-Clear History**: Automated data cleanup based on subscription tier
- **Expense Templates**: Save and reuse common expenses
- **Multi-User Support**: Role-based access (Super Admin, Business Users)
- **Mobile Responsive**: Works seamlessly on phones, tablets, and desktop

## 📋 Prerequisites

- Node.js 16+ and npm
- Supabase account
- Vercel account (for deployment)

## ⚙️ Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd kesti
npm install
```

### 2. Environment Variables

Create `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

Run these SQL scripts in Supabase SQL Editor (in order):

1. **`scripts/1_COMPLETE_RESET_AND_SETUP.sql`** - Initialize database
2. **`scripts/2_SETUP_STORAGE.sql`** - Configure storage buckets
3. **`scripts/3_CREATE_SUPER_ADMIN.sql`** - Create first super admin
4. **`scripts/4_ADD_HISTORY_AUTO_CLEAR.sql`** - Add auto-clear feature

See `scripts/README.md` for detailed script documentation.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
kesti/
├── components/        # React components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── lib/              # Utilities and Supabase client
├── pages/            # Next.js pages and API routes
│   ├── api/         # API endpoints
│   ├── pos.tsx      # Point of Sale page
│   ├── stock.tsx    # Inventory management
│   ├── finance.tsx  # Financial analytics
│   └── ...
├── public/           # Static assets
├── scripts/          # SQL database scripts
└── styles/          # Global styles
```

## 🔑 Default Credentials

**Super Admin:**
- Email: `admin@kesti.com`
- Password: `admin123`

**Test Business User:**
- Email: `test@business.com`
- Password: `test123`
- PIN: `1234`

⚠️ **Change these in production!**

## 🛠️ Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Testing**: Jest, React Testing Library

## 📱 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User authentication |
| POS | `/pos` | Point of sale checkout |
| Stock | `/stock` | Inventory management |
| Finance | `/finance` | Financial dashboard |
| Expenses | `/expenses` | Expense tracking |
| History | `/history` | Transaction history |
| Super Admin | `/super-admin` | Business account management |

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- PIN code protection for sensitive operations
- Account suspension system
- Subscription-based access control

## 📦 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Environment Variables (Production)

Add these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📖 Documentation

- [Database Scripts Guide](scripts/README.md) - SQL scripts documentation
- [API Routes](pages/api/README.md) - API endpoints reference

## 🐛 Troubleshooting

### Database Issues
- Run `scripts/1_COMPLETE_RESET_AND_SETUP.sql` to reset database
- Check RLS policies are enabled

### Authentication Issues
- Verify `.env.local` has correct Supabase keys
- Clear browser cookies and try again

### Image Upload Issues
- Run `scripts/2_SETUP_STORAGE.sql`
- Check storage bucket permissions

## 📄 License

Private Project - All Rights Reserved

## 👨‍💻 Support

For issues or questions, contact the development team.
