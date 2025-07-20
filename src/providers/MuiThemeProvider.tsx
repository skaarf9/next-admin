// src/providers/MuiThemeProvider.tsx
"use client";

import { ThemeProvider } from "@mui/material/styles";
import { useTheme } from "next-themes";
import { createTheme } from "@mui/material/styles";
import { ReactNode, useEffect, useState, useMemo } from "react";

export default function MuiThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 创建与你的设计系统一致的 MUI 主题
  const muiTheme = useMemo(() => {
    // 定义与你的 Tailwind 配置一致的调色板
    const colorPalette = {
      light: {
        primary: {
          main: "#3B82F6", // 类似 Tailwind blue-500
          contrastText: "#ffffff",
        },
        background: {
          default: "#ffffff",
          paper: "#f9fafb", // Tailwind gray-50
        },
        text: {
          primary: "#111928", // 类似你的按钮文字颜色
          secondary: "#6b7280", // Tailwind gray-500
        },
        gray: {
          200: "#e5e7eb", // Tailwind gray-200
          300: "#d1d5db", // Tailwind gray-300
          700: "#374151", // Tailwind gray-700
        },
      },
      dark: {
        primary: {
          main: "#60a5fa", // 类似 Tailwind blue-400
          contrastText: "#ffffff",
        },
        background: {
          default: "#020D1A", // 与你的按钮背景一致
          paper: "#122031", // Tailwind gray-900
        },
        text: {
          primary: "#f3f4f6", // Tailwind gray-100
          secondary: "#9ca3af", // Tailwind gray-400
        },
        gray: {
          200: "#1f2937", // Tailwind gray-800
          300: "#374151", // Tailwind gray-700
          700: "#d1d5db", // Tailwind gray-300
        },
      },
    };

    const palette = resolvedTheme === "dark" ? colorPalette.dark : colorPalette.light;

    return createTheme({
      palette: {
        mode: resolvedTheme === "dark" ? "dark" : "light",
        primary: palette.primary,
        background: palette.background,
        text: palette.text,
        // 添加自定义颜色以便在组件中使用
        custom: palette,
      },
      typography: {
        fontFamily: '"Satoshi", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"', // 与 Tailwind 默认字体一致
        fontSize: 14,
        button: {
          textTransform: "none", // 禁用按钮大写
          fontWeight: 500,
        },
      },
      components: {
        // 全局覆盖 MUI 组件样式以匹配你的设计系统
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: "8px", // 类似 Tailwind rounded-lg
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            },
            contained: {
              fontWeight: 600,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              border: `1px solid ${palette.gray[200]}`,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              backgroundColor: palette.background.paper,
              border: `1px solid ${palette.gray[300]}`,
              borderRadius: "8px",
              "&:hover": {
                borderColor: palette.primary.main,
              },
              "&.Mui-focused": {
                borderColor: palette.primary.main,
                boxShadow: `0 0 0 3px ${palette.primary.main}33`, // 添加焦点环
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: {
              border: "none", // 禁用默认边框
            },
          },
        },
        MuiCheckbox: {
          styleOverrides: {
            root: {
              color: palette.gray[700],
              "&.Mui-checked": {
                color: palette.primary.main,
              },
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              color: palette.gray[300],
            },
            track: {
              backgroundColor: palette.gray[300],
            },
          },
        },
        // 添加更多组件覆盖...
      },
    });
  }, [resolvedTheme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}