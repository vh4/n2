import './globals.css';

/**
 * Metadata configuration for Next.js App Router.
 */
export const metadata = {
  title: 'JLPT N2 Studio — Japanese Mastery System',
  description: 'Master 235 JLPT N2 Grammar Patterns, 1,550+ Vocabulary words, and 380+ Kanji with real-time multi-tenant persistence and speech audio.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * RootLayout Component.
 * The top-level layout wrapping all pages in the Next.js application:
 *  - Injects pre-connected Google Fonts for Inter and Noto Sans JP.
 *  - Configures dark mode and responsive viewport baseline.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child page components to render.
 * @returns {JSX.Element} HTML document root.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
