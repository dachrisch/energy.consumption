"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/actions/register";

export default function Register() {
  const [error, setError] = useState<string>();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const name = formData.get("name")?.toString();

    if (email != undefined && password != undefined && name != undefined) {
      const registerResult = await register({
        email: email,
        password: password,
        name: name,
      });
      ref.current?.reset();
      console.log(`registerResult ${registerResult}`);
      if (registerResult?.success) {
        return router.push("/login");
      } else {
        setError(registerResult.error);
        return;
      }
    }
  };
  return (
    <section className="w-full h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <form
        ref={ref}
        action={handleSubmit}
        className="content-card w-full max-w-[400px] flex flex-col gap-6"
      >
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Create your account
          </h2>
          <p className="page-description mt-2">
            Register to start tracking your energy consumption
          </p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Full Name"
              className="form-input"
              name="name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              className="form-input"
              name="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              className="form-input"
              name="password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="button-primary w-full"
        >
          Sign up
        </button>

        <Link
          href="/login"
          className="text-sm text-center transition duration-150 ease"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Already have an account?
        </Link>
      </form>
    </section>
  );
}
