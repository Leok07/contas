import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LEEO & MARII // CONTAS',
  description: 'Sistema de balanço financeiro e acerto mútuo direto',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#08080a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark bg-[#08080a]">
      <body className="min-h-screen bg-[#08080a] text-zinc-100 selection:bg-orange-500 selection:text-black antialiased">
        {children}
      </body>
    </html>
  );
}
