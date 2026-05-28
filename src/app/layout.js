import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata = {
  title: "3D PokeDex - Ultimate Interactive Pokémon Database",
  description: "Explore an interactive, modern 3D Pokédex built in Next.js. View animated Pokémon, listen to their cries, compare stats, check moves, and view evolution chains.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
