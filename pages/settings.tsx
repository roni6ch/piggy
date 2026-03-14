import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Routes } from '@/common/types';

export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace(Routes.CREDITS);
  }, [router]);
  return null;
}
