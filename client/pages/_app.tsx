import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>زاوية 2025 - نظام حجوزات القاعات الدراسية</title>
        <meta name="description" content="نظام حجوزات متطور للقاعات الدراسية يعمل بالتزامن المباشر" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Arabic RTL support */}
        <html lang="ar" dir="rtl" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 rtl">
        <Component {...pageProps} />
      </div>
    </>
  )
}