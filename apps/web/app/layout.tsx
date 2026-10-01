import type {
  Metadata,
  Viewport
} from "next";
import "./globals.css";
import "./prompt-ui.css";
import "./community.css";
import "./security.css";
import "./moderation.css";
import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "PromptHub",
    template:
      "%s | PromptHub"
  },
  description:
    "Organize, versione e compartilhe prompts de Inteligência Artificial.",
  applicationName:
    "PromptHub",
  manifest:
    "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PromptHub",
    statusBarStyle:
      "black-translucent"
  },
  icons: {
    icon:
      "/icons/icon-192.png",
    apple:
      "/icons/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor:
    "#0d1117",
  colorScheme:
    "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
