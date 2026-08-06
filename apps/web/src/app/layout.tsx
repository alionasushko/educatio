import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Caveat, Fraunces } from "next/font/google";
import Toaster from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Educatio — The whiteboard your students deserve",
    template: "%s · Educatio",
  },
  description:
    "Educatio is a collaborative whiteboard built for one-on-one online tutoring. Draw, write, share, and end every lesson with an AI summary.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
};

export default RootLayout;
