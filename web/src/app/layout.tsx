import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const meta = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  title: 'So What? — Climate risk at LA County places',
  description:
    "A map of LA County bus stops, parks, playgrounds and schools that shows each place's climate risks and what they mean for the people who use it.",
};

async function generateMetadata() {
  return {
    metadataBase: meta.siteUrl ? new URL(meta.siteUrl) : undefined,
    title: meta.title,
    description: meta.description,
    openGraph: {
      siteName: 'So What?',
      title: meta.title,
      description: meta.description,
      url: '/',
    },
  };
}

function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

export { generateMetadata };
export default RootLayout;
