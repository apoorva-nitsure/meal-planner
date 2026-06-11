import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "MealPlanner",
  description: "Your weekly meal planning and nutrition tracking app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 pt-14 md:pt-6 md:p-6 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
