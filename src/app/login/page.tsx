"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// Assume this is a client-compatible feature flag function
import { isFeatureEnabled } from "@/lib/featureFlags"; // Adjust path accordingly

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  useLayoutEffect(() => {
    const checkFeature = async () => {
      const enabled = await isFeatureEnabled("registration");
      setRegistrationEnabled(enabled);
    };
    checkFeature();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const loginResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (loginResult?.error) {
      setError(loginResult.error as string);
    }
    if (loginResult?.ok) {
      router.push("/");
    }
  };

  return (
    <section className="w-full h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="content-card w-full max-w-[400px] flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Sign in to your account
          </h2>
          <p className="page-description mt-2">
            Enter your credentials to access the Energy Consumption Monitor
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="email-address" className="form-label">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="button-primary w-full"
            >
              Sign in
            </button>
          </div>
        </form>

        {isClient && registrationEnabled && (
          <Link
            href="/register"
            className="text-sm text-center transition duration-150 ease"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Need an account?
          </Link>
        )}
      </div>
    </section>
  );
};

export default LoginPage;
