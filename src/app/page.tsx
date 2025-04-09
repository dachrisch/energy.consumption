"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const Home = () => {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }, [status, router]);

  return null;
};

export default Home;
