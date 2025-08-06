import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Core Web Vitals Optimizations */}
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link rel="preconnect" href="https://accelerate.prisma-data.net/" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com/" />
        <link
          rel="preload"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
          />
        </noscript>
        {/* Performance optimization meta tags */}
        <meta name="theme-color" content="#108043" />
        <meta name="color-scheme" content="light" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
