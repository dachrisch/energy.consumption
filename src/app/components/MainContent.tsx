"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't apply sidebar margin on login/register pages or when not authenticated
  const shouldApplySidebarMargin = session && pathname !== "/login" && pathname !== "/register";

  return (
    <main className={shouldApplySidebarMargin ? "main-with-sidebar" : ""}>
      <Breadcrumbs />
      {children}
    </main>
  );
}
