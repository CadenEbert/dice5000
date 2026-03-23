import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/nav";
import ApolloClientProvider from "./components/ApolloProvider";
import app from "./lib/firebase";




const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Dice 5000",
  description: "A real-time multiplayer dice game built with Next.js, GraphQL, and Firebase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        
        <ApolloClientProvider>
          
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
