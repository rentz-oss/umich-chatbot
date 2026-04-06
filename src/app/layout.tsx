import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UMich Foster Youth Chatbot",
  description: "Files-only chatbot pilot for University of Michigan support content."
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
