import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "TiffinPro — Tiffin Management Made Simple",
  description:
    "Manage your tiffin business with TiffinPro. Providers manage customers, track meals, and grow their business effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--s2)",
              color: "var(--t1)",
              border: "1px solid var(--bd2)",
              borderRadius: "var(--r1)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
            },
            success: {
              iconTheme: { primary: "var(--green)", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "var(--red)", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
