import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only show the first few characters of keys for security
  const mask = (str: string | undefined) => {
    if (!str) return 'undefined';
    if (str.length <= 8) return '*'.repeat(str.length);
    return str.substring(0, 4) + '*'.repeat(str.length - 8) + str.substring(str.length - 4);
  };
  
  const envInfo = {
    // Information about environment variables
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    // Information about Node.js process
    process: {
      version: process.version,
      env: process.env.NODE_ENV,
    },
    // Information about the server
    server: {
      time: new Date().toISOString(),
      uptime: process.uptime(),
    }
  };
  
  res.status(200).json(envInfo);
}
