import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Jonathan Mwaniki Reports - Latest news, business, tech, sports, and entertainment from Kenya and beyond." />
        <meta name="keywords" content="Kenya news, business, tech, sports, entertainment, opinions, Jonathan Mwaniki" />
        <meta name="author" content="Jonathan Mwaniki" />
        <meta property="og:title" content="Jonathan Mwaniki Reports" />
        <meta property="og:description" content="Your source for news, business, tech, sports, and entertainment from Kenya and beyond." />
        <meta property="og:image" content="/images/Jonathan-Mwaniki-logo.png" />
        <meta property="og:url" content="https://jonathanmwaniki.co.ke" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@maestropuns" />
        <meta name="twitter:creator" content="@maestropuns" />
        <link rel="icon" href="/images/Jonathan-Mwaniki-logo.png" sizes="96x96" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}