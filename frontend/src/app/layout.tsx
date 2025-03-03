import "./globals.css";
import { Inter } from "next/font/google";
import type React from "react";
import Notifications from '@/components/Notifications';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BrewNet - Connect with Coffee Lovers",
  description: "Join BrewNet to connect with like-minded coffee enthusiasts around you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
        {children}
        <Notifications />
      </body>
    </html>
  );
}
