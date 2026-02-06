import "./globals.css";
import { Inter } from "next/font/google";
import GameStoreProvider from "../components/providers/GameStoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SkyRealms Chronicles",
  description: "Immersive sandbox RPG inspired by Skyblock, Wynncraft, and Hytale."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GameStoreProvider>
          {children}
        </GameStoreProvider>
      </body>
    </html>
  );
}
