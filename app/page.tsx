'use client';

import { useAppEnvironment } from '@/components/providers';
import { AppShell } from '@/components/app/app-shell';
import { LandingPage } from '@/components/home/LandingPage';

export default function Home() {
  const { isStandalone } = useAppEnvironment();

  if (isStandalone) {
    return <AppShell />;
  }

  return <LandingPage />;
}

