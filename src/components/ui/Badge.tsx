interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal';
  size?: 'sm' | 'md';
}

const variants = {
  success: { bg: 'rgba(0,200,100,0.15)', color: '#00c864', border: 'rgba(0,200,100,0.25)' },
  warning: { bg: 'rgba(255,167,38,0.15)', color: '#ffa726', border: 'rgba(255,167,38,0.25)' },
  danger: { bg: 'rgba(255,85,85,0.15)', color: '#ff5555', border: 'rgba(255,85,85,0.25)' },
  info: { bg: 'rgba(30,136,229,0.15)', color: '#42a5f5', border: 'rgba(30,136,229,0.25)' },
  neutral: { bg: 'rgba(136,153,187,0.12)', color: '#8899bb', border: 'rgba(136,153,187,0.2)' },
  teal: { bg: 'rgba(0,212,170,0.15)', color: '#00d4aa', border: 'rgba(0,212,170,0.25)' },
};

export default function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const v = variants[variant];
  return (
    <span
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 20,
        padding: size === 'sm' ? '2px 9px' : '4px 12px',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        letterSpacing: '0.3px',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </span>
  );
}

