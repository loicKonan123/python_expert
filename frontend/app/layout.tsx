import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polaris — Le tuteur dev sourcé",
  description:
    "Tuteur full-stack qui ne ment pas : chaque réponse est citée dans la doc officielle de Python, FastAPI, Pydantic, Next.js, TypeScript et Tailwind, et le code généré peut être exécuté en direct.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${geist.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
      </head>
      <body className="min-h-full bg-background text-on-background font-sans">
        <div className="bg-glow" aria-hidden="true">
          <div className="orb" />
        </div>
        {children}
      </body>
    </html>
  );
}
