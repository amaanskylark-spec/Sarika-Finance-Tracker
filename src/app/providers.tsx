'use client';

import { AppProvider } from '@/contexts/app-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
