import './globals.css';
import { ReactNode } from 'react';
import { Inter, Manrope } from 'next/font/google';
import { ToastProvider } from '../lib/hooks/use-toast';
import { cn } from '../lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-heading' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.variable, manrope.variable, 'font-sans')}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
