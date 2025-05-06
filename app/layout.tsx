import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/dark-theme";
import { ModeToggle } from "@/components/theme-toggle";
import { Vote } from "lucide-react";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "區塊鏈投票",
  description: "基於區塊鏈驗證系統的匿名投票系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <div className="flex flex-col h-screen w-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <nav className="border-b-border border-1 w-screen">
              <div className="mx-auto flex justify-between py-4 max-w-7xl px-8">
                <div className="flex gap-4 place-items-center">
                  <Vote />
                  <h1 className="font-bold text-xl">區塊鏈投票</h1>
                </div>
                <div>
                  <ModeToggle />
                </div>
              </div>
            </nav>

            <main className="mx-auto max-w-6xl p-5 h-full w-full">
              {children}
            </main>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
