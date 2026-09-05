import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Create or get the admin user in Supabase Auth
  let userId: string;

  // Try to list users and find by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users?.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Admin",
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    userId = newUser!.user.id;
  }

  // 2. Ensure the user_profiles row has admin role
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      role: "admin",
      full_name: "Admin",
      is_active: true,
    })
    .eq("id", userId);

  if (profileError) {
    // If update fails, the row might not exist yet (trigger creates it on auth insert)
    // Try insert as fallback
    const { error: insertError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        role: "admin",
        full_name: "Admin",
        is_active: true,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Admin account ready",
    email: adminEmail,
    userId,
  });
}
