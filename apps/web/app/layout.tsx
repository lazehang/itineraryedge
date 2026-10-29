import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ItineraryEdge",
  description:
    "Open-core edge visa itinerary engine — embassy-style travel schedules and PDF packets on Cloudflare.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
