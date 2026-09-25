import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "./db/client";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "School email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const emailHash = createHash("sha256").update(email).digest("hex");
        const windowStart = new Date(Date.now() - 15 * 60 * 1000);
        const failedAttempts = await prisma.loginAttempt.count({ where: { emailHash, failedAt: { gte: windowStart } } });
        if (failedAttempts >= 5) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
          await prisma.loginAttempt.create({ data: { emailHash, userId: user?.id } });
          return null;
        }
        await prisma.loginAttempt.deleteMany({ where: { emailHash } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerifiedStudent: user.studentVerifiedAt !== null,
          countryCode: user.countryCode,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.isVerifiedStudent = user.isVerifiedStudent;
        token.countryCode = user.countryCode;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.userId === "string") session.user.id = token.userId;
        if (token.role === "STUDENT" || token.role === "VENDOR" || token.role === "ADMIN") {
          session.user.role = token.role;
        }
        if (typeof token.isVerifiedStudent === "boolean") {
          session.user.isVerifiedStudent = token.isVerifiedStudent;
        }
        if (typeof token.countryCode === "string") session.user.countryCode = token.countryCode;
      }
      return session;
    },
  },
});