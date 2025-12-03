import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        {/* Favicon and Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/logo no bg low qulity.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/logo no bg low qulity.png" />
        <link rel="apple-touch-icon" href="/logo/logo no bg low qulity.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

