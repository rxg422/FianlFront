import type { Metadata } from 'next';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: '전북路',
  description: '전북 여행 플래너',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
