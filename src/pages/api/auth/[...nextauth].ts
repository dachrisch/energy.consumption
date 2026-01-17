import User from "@/models/User";
import type { NextAuthOptions } from "next-auth";
import credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import NextAuth from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    credentials({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        console.debug(`[NextAuth] Authorizing user: ${credentials?.email}`);
        const user = await User.findOne({
          email: credentials?.email,
        }).select("+password");

        if (!user) {
          console.warn(`[NextAuth] User not found: ${credentials?.email}`);
          throw new Error("Invalid User credentials");
        }

        const passwordMatch = await bcrypt.compare(
          credentials!.password,
          user.password
        );

        if (!passwordMatch) {
          console.warn(`[NextAuth] Password mismatch for: ${credentials?.email}`);
          throw new Error("Invalid User credentials");
        }
        
        console.log(`[NextAuth] Login successful: ${user.email} (${user.id})`);
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Using the `...rest` parameter to be able to narrow down the type based on `trigger`
    jwt({ token, trigger, session, user }) {
      if (trigger === "update" && session?.name) {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        token.name = session.name;
      }
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
