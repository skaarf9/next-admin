import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";
import { Providers } from "./providers";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import type { PropsWithChildren } from "react";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}