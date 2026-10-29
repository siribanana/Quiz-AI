import type { Metadata } from "next";
import { Lexend_Deca, Roboto_Mono } from "next/font/google";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import "./globals.css";

const lexendDeca = Lexend_Deca({
  variable: "--font-ui",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiz AI",
  description: "Generate a timed fill-in-the-blank quiz on any topic.",
};

// Sets the theme attribute before paint so switching themes doesn't flash
// the default colors on reload, and lets a URL like /?theme=hammerhead open
// straight into that theme. Must stay in sync with THEME_STORAGE_KEY in
// lib/theme.ts since it runs before any JS module loads. There are 187
// themes, too many to list here, so this only checks the id shape
// (lowercase/digits/underscore) — an id that doesn't match any real theme
// just matches no CSS override block and silently falls back to the
// default, so this is a shape check, not a correctness guarantee.
const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var shape = /^[a-z0-9_]{1,40}$/;
    var qp = new URLSearchParams(location.search).get("theme");
    var t = (qp && shape.test(qp)) ? qp : localStorage.getItem("quizai-theme");
    if (t && shape.test(t)) {
      document.documentElement.setAttribute("data-theme", t);
      if (qp) localStorage.setItem("quizai-theme", qp);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lexendDeca.variable} ${robotoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeSwitcher />
      </body>
    </html>
  );
}
