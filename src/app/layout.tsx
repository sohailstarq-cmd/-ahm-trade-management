import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AL HAMZA MERIDIAN — Trade Management System",
  description: "Internal commodity trading CRM and trade management system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
