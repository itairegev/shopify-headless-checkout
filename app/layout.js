import { Inter } from 'next/font/google';
import ConfigurationWarning from './components/ConfigurationWarning';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Shopify Headless Checkout',
  description: 'A headless checkout solution for Shopify with subscription management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigurationWarning />
        {children}
      </body>
    </html>
  );
}
