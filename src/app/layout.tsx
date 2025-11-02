import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./layout/main.css";
import { Provider } from "./provider";
import AppBar from './components/AppBar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Energy Consumption Monitor",
  description: "Monitor and track your energy consumption",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Provider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AppBar />
          <main>
            {children}
          </main>
        </body>
      </Provider>
    </html>
  );
}
