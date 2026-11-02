import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forex Time Point",
  description:
    "Minimalist 24-hour clock for trading sessions, time ranges, GMT time zones, Forex Factory events and pre-event alerts.",
  applicationName: "Forex Time Point",
  appleWebApp: { capable: true, title: "Time Point", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
  ],
};

/* Applies a saved light/dark choice before first paint to avoid a flash. */
const themeScript = `try{var t=JSON.parse(localStorage.getItem("ftp:theme")||"null");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
