import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { finalDomain, images, property } from "./site-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || finalDomain;
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "North Salt Lake Apartments | Woods Crossing",
    template: "%s",
  },
  description:
    "Source-backed Woods Crossing apartment website for North Salt Lake, Utah, with floor plans, amenities, availability, reviews, and resident resources.",
  icons: {
    icon: images.logo,
    shortcut: images.logo,
  },
  applicationName: property.name,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs summary" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLMs full reference" />
      </head>
      <body>
        {gtmId ? (
          <Script id="gtm-placeholder" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        ) : null}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-placeholder" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
