import type { Metadata } from "next";
import { Atma, Inter, Shadows_Into_Light, Zain } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { Navbar } from "@/components/navbar";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

const atma = Atma({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-atma",
});

const shadowsIntoLight = Shadows_Into_Light({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-shadows-into-light",
});

const zain = Zain({
  weight: ["200", "300", "400", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-zain",
});

export const metadata: Metadata = {
  title: "Budgie - Budget Planner",
  description: "Track personal expenses month-to-month",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} ${atma.variable} ${shadowsIntoLight.variable} ${zain.variable}`}>
          <Navbar />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
