import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Campaign Logo Agent",
  description: "Generate tailored logo concepts for Meta ad campaigns in minutes."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
