import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://portal.varmaninnovationlabs.com"),
  title: "Free Student Entrepreneurship Masterclass | Varman",
  description: "A free live startup masterclass for college students.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Turn your idea into a startup roadmap—in 60 minutes",
    description: "A free live startup masterclass for college students.",
    url: "/",
    siteName: "Varman Innovation Labs",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Indian college students collaborating on a startup idea" }],
    type: "website"
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
