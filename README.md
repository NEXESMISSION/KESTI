# KESTI - Cashier SaaS Admin Platform

A modern point-of-sale and business management system built with React and Supabase.

## Features

- **Multi-Business Management**: Support multiple businesses with individual configurations
- **Point of Sale (POS)**: Fast and intuitive cashier interface
- **Product Management**: 
  - Product categories
  - Image uploads
  - Fixed and weight-based pricing
  - Stock alerts
- **Sales & Reporting**:
  - Real-time sales tracking
  - Historical sales reports
  - Financial summaries
- **Expense Tracking**: Monitor business expenses
- **Device Session Management**: Control active devices per business
- **Settings Management**: Business configuration, PIN, and password updates

## Tech Stack

- **Frontend**: React 19, React Router, Vite
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Deployment**: Vercel
- **Language**: TypeScript/JavaScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NEXESMISSION/KESTI.git
cd KESTI
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

## Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NEXESMISSION/KESTI)

### Manual Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Database Setup

The project includes Supabase migrations in the `supabase/migrations` folder. To set up the database:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
npx supabase link --project-ref your-project-ref
```

3. Push migrations:
```bash
npx supabase db push
```

4. Deploy edge functions:
```bash
npx supabase functions deploy create-business-account
```

## Project Structure

```
cashier-saas-admin/
├── src/
│   ├── components/        # React components
│   ├── supabaseClient.js  # Supabase configuration
│   └── App.jsx            # Main app component
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
├── public/                # Static assets
└── index.html            # Entry HTML file
```

## Currency

The system uses **TND (Tunisian Dinar)** as the default currency.

## Version

Current Version: **V10.1** - Production Ready

## License

Proprietary - All rights reserved

## V11 Update Instructions

### Critical: Apply V11 SQL Migration

The V11 update includes critical fixes for:
- ✅ Automatic `business_id` population (fixes INSERT errors)
- ✅ Phone number fields for businesses
- ✅ Robust device session management with automatic limit enforcement
- ✅ Password update edge function

**Step 1: Apply SQL Migration**

```bash
# Open Supabase SQL Editor in your dashboard
# Copy and paste the contents of V11_COMPLETE_FIX.sql
# Run the migration
```

Or use the CLI:
```bash
cat V11_COMPLETE_FIX.sql | npx supabase db execute
```

**Step 2: Deploy Edge Functions**

```bash
# Deploy the updated create-business-account function (with phone numbers)
npx supabase functions deploy create-business-account

# Deploy the new password update function
npx supabase functions deploy update-business-password
```

**Step 3: Redeploy to Vercel**

Vercel will automatically detect the git push and redeploy. Or trigger manually:
```bash
vercel --prod
```

### What's New in V11?

1. **Fixed business_id Issues**: Database triggers now automatically set `business_id` when creating products, categories, or expenses
2. **Phone Numbers**: Businesses can now have up to 3 phone numbers
3. **Search Bar**: Super Admin Dashboard now has a search bar to filter businesses
4. **Robust Device Limits**: 
   - Sessions expire after 5 minutes of inactivity
   - When device limit is reached, oldest session is automatically removed
   - Session monitor checks every 30 seconds and logs out if kicked out
   - Device limit is now properly enforced (e.g., limit of 1 = only 1 active device)
5. **Password Change**: Super Admin can now change business admin passwords (requires edge function)

## Troubleshooting

### CORS Errors on Production

If you encounter CORS errors when creating business accounts:

1. **Ensure Edge Function is Deployed**:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase functions deploy create-business-account
   ```

2. **Check Edge Function Status**:
   - Go to Supabase Dashboard → Functions
   - Verify `create-business-account` is deployed and active

3. **Verify Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Redeploy after adding variables

### Autocomplete Warnings

All password and email inputs now have proper `autocomplete` attributes to prevent browser warnings.

## Production Deployment Checklist

- [ ] Push code to GitHub repository
- [ ] Link Supabase project: `npx supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Deploy edge functions: `npx supabase functions deploy create-business-account`
- [ ] Import project to Vercel from GitHub
- [ ] Set environment variables in Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Deploy on Vercel
- [ ] Test creating a business account
- [ ] Test login and POS functionality

## Support

For support or questions, please contact the development team.
