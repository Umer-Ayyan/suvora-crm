import "./globals.css";

import Providers from "@/components/providers";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}

          <Toaster
            position="top-right"
            richColors
          />
        </Providers>
      </body>
    </html>
  );
}