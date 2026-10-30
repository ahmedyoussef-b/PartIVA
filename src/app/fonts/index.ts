import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    { path: './Inter-300.woff2', weight: '300', style: 'normal' },
    { path: './Inter-400.woff2', weight: '400', style: 'normal' },
    { path: './Inter-500.woff2', weight: '500', style: 'normal' },
    { path: './Inter-600.woff2', weight: '600', style: 'normal' },
    { path: './Inter-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const poppins = localFont({
  src: [
    { path: './Poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './Poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './Poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './Poppins-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
});

export const firaCode = localFont({
  src: [
    { path: './FiraCode-400.woff2', weight: '400', style: 'normal' },
    { path: './FiraCode-400.woff2', weight: '500', style: 'normal' },
    { path: './FiraCode-400.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
});
