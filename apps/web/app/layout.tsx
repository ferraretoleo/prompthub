import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PromptHub", template: "%s | PromptHub" },
  description: "Organize, versione e compartilhe prompts de Inteligência Artificial.",
  applicationName: "PromptHub",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PromptHub", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" }
};
export const viewport: Viewport = { themeColor: "#070b14", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
