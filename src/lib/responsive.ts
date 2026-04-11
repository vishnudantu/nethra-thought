// Responsive utilities used across all modules
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [bp, setBp] = useState({
    isMobile: false,   // < 640px
    isTablet: false,   // 640–1024px
    isDesktop: true,   // > 1024px
    width: 1440,
  });

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setBp({
        isMobile: w < 640,
        isTablet: w >= 640 && w < 1024,
        isDesktop: w >= 1024,
        width: w,
      });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return bp;
}

// Responsive grid columns
export function cols(mobile: number, tablet: number, desktop: number, width: number): string {
  if (width < 640) return `repeat(${mobile}, 1fr)`;
  if (width < 1024) return `repeat(${tablet}, 1fr)`;
  return `repeat(${desktop}, 1fr)`;
}

// Common card style
export const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

// Common label style
export const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#8899bb',
  textTransform: 'uppercase', letterSpacing: 0.8,
  display: 'block', marginBottom: 6,
};

// Common input style
export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '9px 13px',
  color: '#f0f4ff', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};

// Primary button
export const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg,#00d4aa,#1e88e5)',
  border: 'none', borderRadius: 10,
  padding: '9px 20px', color: '#060b18',
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 7,
  whiteSpace: 'nowrap',
};

// Section header
export function sectionHeader(title: string, subtitle?: string) {
  return { title, subtitle };
}

// Format numbers for display
export function fmtNum(n: number): string {
  if (n >= 10000000) return `${(n/10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n/100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`;
  return `${n}`;
}

// AI response panel style
export const aiPanel: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(0,212,170,0.06), rgba(30,136,229,0.04))',
  border: '1px solid rgba(0,212,170,0.2)',
  borderRadius: 14, padding: 16,
};
