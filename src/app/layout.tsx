import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Help Zone Admin",
  description: "Admin panel for managing users, service providers, KYC and services.",
};

// Runs during HTML parsing, before first paint. The panel always opens in light
// mode; dark is only applied if it was chosen earlier in this same browser tab
// session (sessionStorage), and any old permanent choice is cleared.
const themeScript = `(function(){var d=document.documentElement;try{localStorage.removeItem("theme")}catch(e){}try{d.setAttribute("data-theme",sessionStorage.getItem("theme")==="dark"?"dark":"light")}catch(e){d.setAttribute("data-theme","light")}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
