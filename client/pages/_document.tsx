import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* Mobile-first meta tags (excluding viewport which should be in _app.js) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* Google Fonts - Arabic */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="font-arabic">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}