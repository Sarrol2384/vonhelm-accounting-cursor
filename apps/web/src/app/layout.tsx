import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { OwnerShell } from '@/components/owner-shell';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/brand';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: `${PRODUCT_TAGLINE} AI-powered finance for South African business owners.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          <OwnerShell>{children}</OwnerShell>
        </AuthProvider>
      </body>
    </html>
  );
}
