import { useState, useEffect } from 'react';

export function useW(): number {
  const [w, setW] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

export const isMob = (w: number): boolean => w < 640;
export const isTab = (w: number): boolean => w >= 640 && w < 1024;
export const isDesk = (w: number): boolean => w >= 1024;
