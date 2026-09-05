"use server";

import { validateAdminCredentials, createAdminSession, deleteAdminSession } from "@/lib/admin-auth";

export async function adminLogin(email: string, password: string) {
  if (!validateAdminCredentials(email, password)) {
    return { error: "Invalid email or password" };
  }

  await createAdminSession(email, "admin");
  return { success: true };
}

export async function adminLogout() {
  await deleteAdminSession();
  return { success: true };
}
