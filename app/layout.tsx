import type {Metadata, Viewport} from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0f1320',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Flag Battle: Marble Race',
  description: 'An exhilarating mobile-first marble race game featuring country flags bouncing through rotating neon concentric ring barriers.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Flag Battle',
  },
  openGraph: {
    title: 'Flag Battle: Marble Race',
    description: 'An exhilarating mobile-first marble race game featuring country flags bouncing through rotating neon concentric ring barriers.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flag Battle: Marble Race',
    description: 'An exhilarating mobile-first marble race game featuring country flags bouncing through rotating neon concentric ring barriers.',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-[#0f1320] text-slate-100 antialiased overflow-x-hidden select-none touch-manipulation">
        {children}
      </body>
    </html>
  );
}
