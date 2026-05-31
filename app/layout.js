import { Inter, Lora } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import QuickLinks from "@/components/QuickLinks";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata = {
  title: "PhysicsLab — Laws, Statements & Practicals",
  description:
    "Interactive practicals you can play with, the exact statements behind them, and the formulas that make them work — Physics, Chemistry & Maths in one place.",
};

// Apply the saved theme before first paint so there's no flash of the wrong theme.
const themeInit = `(function(){try{if(localStorage.getItem('physlab-theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <QuickLinks />
        <Sidebar />
        {children}
        <footer className="site-footer">
          <p>
            Interactive Physics, Chemistry &amp; Maths — explore the laws, play
            with the practicals, and read the formulas behind them.
          </p>
          <p className="muted">
            PhysicsLab · an interactive demonstration of classical physics
          </p>
        </footer>
      </body>
    </html>
  );
}
