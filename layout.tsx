import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'TapTalk — One-tap Walkie Talkie', description: 'Instant voice rooms with a code or link.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0d1425' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
