'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function useAuthConfig() {
  const [config, setConfig] = useState<{ supabaseEnabled: boolean; supabaseUrl: string | null }>({
    supabaseEnabled: isSupabaseConfigured(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });

  useEffect(() => {
    api.authConfig().then(setConfig).catch(() => {
      setConfig({
        supabaseEnabled: isSupabaseConfigured(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      });
    });
  }, []);

  return config;
}
