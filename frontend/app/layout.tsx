import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harbinger Academy LMS",
  description: "Enterprise Learning Management System by Harbinger",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full w-full overflow-x-hidden antialiased`}>
      <body className="min-h-screen w-full overflow-x-hidden flex flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          containerStyle={{
            top: 72,
            right: 24,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "13px",
              borderRadius: "12px",
              padding: "12px 18px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            },
            error: {
              style: {
                background: "#991b1b",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                borderRadius: "12px",
                padding: "12px 18px",
                boxShadow: "0 20px 25px -5px rgba(153, 27, 27, 0.4)",
                border: "1px solid #f87171",
              },
              iconTheme: {
                primary: "#ffffff",
                secondary: "#991b1b",
              },
            },
            success: {
              style: {
                background: "#065f46",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                borderRadius: "12px",
                padding: "12px 18px",
                boxShadow: "0 20px 25px -5px rgba(6, 95, 70, 0.4)",
                border: "1px solid #34d399",
              },
              iconTheme: {
                primary: "#ffffff",
                secondary: "#065f46",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
