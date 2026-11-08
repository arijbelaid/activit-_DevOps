import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DevSecOps Portfolio — Arij Belaid (Next.js)",
  description: "Portfolio DevSecOps réalisé avec Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans bg-slate-950 text-slate-100">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
