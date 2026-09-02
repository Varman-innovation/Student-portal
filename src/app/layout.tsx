import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Varman Student Webinars",
  description: "Student onboarding and webinar registration portal"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
