"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import MuiThemeProvider from "@/providers/MuiThemeProvider";
import { AlertProvider } from '@/contexts/AlertContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <MuiThemeProvider>
        <AlertProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </AlertProvider>
      </MuiThemeProvider>
    </ThemeProvider>
  );
}
