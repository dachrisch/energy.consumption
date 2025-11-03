"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./contexts/ThemeContext";

type Props = {
  children?: React.ReactNode;
};

export const Provider = ({ children }: Props) => {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
};