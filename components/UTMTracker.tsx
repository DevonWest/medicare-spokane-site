'use client';
import { useEffect } from 'react';
import { captureUTM } from '@/lib/utm';

export function UTMTracker() {
  useEffect(() => {
    captureUTM();
  }, []);
  return null;
}
