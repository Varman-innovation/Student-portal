import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Free Career Guidance Webinar After 12th | Varman',
  description:
    'Confused about what to do after 12th? Join our free career guidance webinar to explore modern career paths, AI, entrepreneurship and practical opportunities.',
  openGraph: {
    title: 'Free Career Guidance Webinar After 12th | Varman',
    description:
      'Explore modern career paths, AI, entrepreneurship and practical opportunities in a free career guidance webinar for students and parents.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Free Career Guidance Webinar After 12th | Varman',
    description:
      'Explore modern career paths, AI, entrepreneurship and practical opportunities in a free career guidance webinar for students and parents.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
