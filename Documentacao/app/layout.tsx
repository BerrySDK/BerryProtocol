import "./global.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

export const metadata: Metadata = {
  title: "BerrySDK Documentation",
  description: "Official documentation for BerryProtocol and BerryOTP.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          search={{
            enabled: true,
            links: [
              ["BerryProtocol", "/docs/berryprotocol"],
              ["BerryOTP", "/docs/berryotp"],
              ["GitHub", "https://github.com/BerrySDK/BerryProtocol"],
            ],
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
