import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://polaris.local"),
  title: {
    default: "Polaris — Le tuteur dev qui ne ment pas",
    template: "%s · Polaris",
  },
  description:
    "Tuteur full-stack qui ne ment pas : chaque réponse est citée dans la doc officielle de Python, FastAPI, Pydantic, Next.js, TypeScript et Tailwind, et le code généré peut être exécuté en direct.",
  keywords: [
    "Python",
    "FastAPI",
    "Pydantic",
    "Next.js",
    "TypeScript",
    "Tailwind",
    "RAG",
    "tuteur",
    "documentation",
    "Polaris",
  ],
  authors: [{ name: "Loïc Konan", url: "https://github.com/loicKonan123" }],
  creator: "Loïc Konan",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Polaris — Le tuteur dev qui ne ment pas",
    description:
      "RAG local sur 13 corpus officiels. Chaque réponse est sourcée, chaque code est exécuté.",
    siteName: "Polaris",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polaris — Le tuteur dev qui ne ment pas",
    description:
      "RAG local sur 13 corpus officiels. Chaque réponse est sourcée, chaque code est exécuté.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0b1326" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
  ],
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
