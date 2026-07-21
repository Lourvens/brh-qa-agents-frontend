import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// BRH institutional font stack — see docs/UIUX-PRINCIPLES.md §3 and
// docs/brand/BRH-PALETTE.md. Loaded self-hosted via next/font so
// no third-party requests are made from end users.
const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BRH Intelligence QueryEngine",
  description:
    "Assistant conversationnel sur la Revue Développement De Connaissances et Compétences Financières (RDDCF) de la Banque de la République d'Haïti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${roboto.variable}`}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
