import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./layout/main.css";
import "./layout/sidebar.css";
import { Provider } from "./provider";
import AppBar from './components/AppBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

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
          <div className="app-container">
            <AppBar />
            <div className="app-content-wrapper">
              <Sidebar />
              <MainContent>{children}</MainContent>
            </div>
          </div>
        </body>
      </Provider>
    </html>
  );
}
