import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg?v=1" />
        <link rel="shortcut icon" href="/favicon.svg?v=1" />
        <meta name="theme-color" content="#fbbf24" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
