import React from 'react';

const icons: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2.5 5.5L8 16l2.5-5.5z" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.7" cy="10.7" r="6.8" />
      <path d="m16 16 5 5" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  heart: (
    <path d="M20.6 8.6c0 5-8.6 10.7-8.6 10.7S3.4 13.6 3.4 8.6a5 5 0 0 1 8.6-3.3 5 5 0 0 1 8.6 3.3z" />
  ),
  share: <path d="M12 16V3m-5 5 5-5 5 5M5 14v6h14v-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20v-2c0-4 3-6 7-6s7 2 7 6v2M16 5c3 0 5 2 5 5m-3 4c2 1 3 3 3 6" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  close: <path d="M5 5 19 19M19 5 5 19" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  message: <path d="M21 11a8 8 0 0 1-8 8H5l-3 3v-9a9 9 0 1 1 19-2z" />,
  filter: <path d="M4 7h16M7 12h10M10 17h4" />,
  edit: <path d="m4 16 12-12 4 4-12 12-5 1zM14 6l4 4" />,
  logout: <path d="M10 4H4v16h6M14 7l5 5-5 5M7 12h12" />,
  send: (
    <>
      <path d="m3 3 18 9-18 9 4-9z" />
      <path d="M7 12h14" />
    </>
  ),
  star: (
    <path d="m12 2 2.8 6.4L22 9l-5.4 4.8 1.6 7.2L12 17.2 5.8 21l1.6-7.2L2 9l7.2-.6z" />
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  spark: (
    <path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z" />
  ),
  camera: (
    <>
      <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
    </>
  )
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, size = 19, className = '', style }) => {
  const content = icons[name] || icons.star;
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {content}
    </svg>
  );
};

export const GoogleLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);
