import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ClientShell from './ClientShell';
import AxiosConfig from '@/api/AxiosConfig';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Carlog — 자동차 SNS',
  description: '자동차 정보 공유와 자랑을 위한 소셜 네트워크 서비스',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AxiosConfig />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
