import { redirect } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "../db/client";

export async function requireVerifiedStudent() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, studentVerifiedAt: true, countryCode: true },
  });
  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentVerifiedAt) {
    redirect("/account?eligibility=required");
  }
  return {
    id: currentUser.id,
    role: currentUser.role,
    isVerifiedStudent: true,
    countryCode: currentUser.countryCode,
  };
}