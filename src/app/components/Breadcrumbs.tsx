"use client";

import { usePathname, useRouter } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const pathMapping: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/readings": "Readings",
  "/charts": "Charts",
  "/add": "Add Data",
  "/contracts": "Contracts",
  "/login": "Login",
  "/register": "Register",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show breadcrumbs on login/register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  const pathSegments = pathname.split("/").filter(Boolean);

  // Build breadcrumbs from path segments
  let currentPath = "";
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = pathMapping[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      label,
      path: currentPath,
    });
  });

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumbs-item">
          <button
            onClick={() => router.push("/dashboard")}
            className="breadcrumbs-link"
          >
            Home
          </button>
        </li>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={breadcrumb.path} className="breadcrumbs-item">
              <span className="breadcrumbs-separator">/</span>
              {isLast ? (
                <span className="breadcrumbs-current" aria-current="page">
                  {breadcrumb.label}
                </span>
              ) : (
                <button
                  onClick={() => router.push(breadcrumb.path)}
                  className="breadcrumbs-link"
                >
                  {breadcrumb.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
