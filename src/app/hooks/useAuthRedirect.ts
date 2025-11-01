import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Custom hook to redirect unauthenticated users to login
 * Centralizes authentication check and redirect logic
 *
 * @param redirectTo - The path to redirect to if not authenticated (default: "/login")
 */
export const useAuthRedirect = (redirectTo = "/login") => {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo]);

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
};
