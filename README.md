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

## Support

For support or questions, please contact the development team.
