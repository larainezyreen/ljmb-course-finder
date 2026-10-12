import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LJMB Course Finder',
  description: 'Find LJMB courses for your team’s learning needs with document-grounded answers and retrieved sources.',
  openGraph: {
    title: 'LJMB Course Finder',
    description: 'Explore leadership, delegation, and coaching courses using LJMB documents.',
    url: 'https://ljmb-course-finder.vercel.app',
    siteName: 'LJMB Course Finder',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
