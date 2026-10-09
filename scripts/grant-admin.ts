/**
 * Grants administrator access to an existing user (trusted, out-of-band process).
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/grant-admin.ts someone@example.com
 * Equivalent SQL (Supabase SQL editor):
 *   insert into public.admin_users (user_id, note) select id, 'granted manually' from auth.users where email = 'someone@example.com';
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!email || !url || !key) {
  console.error("Usage: NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx scripts/grant-admin.ts <email> [--revoke]");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  let page = 1;
  let user: { id: string; email?: string } | undefined;
  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (data.users.length < 200) break;
    page++;
  }
  if (!user) throw new Error(`No user with email ${email}. Ask them to sign up first.`);
  if (process.argv.includes("--revoke")) {
    const { error } = await supabase.from("admin_users").delete().eq("user_id", user.id);
    if (error) throw error;
    console.log(`Revoked administrator access for ${email}`);
  } else {
    const { error } = await supabase.from("admin_users").upsert({ user_id: user.id, note: `granted via script ${new Date().toISOString()}` });
    if (error) throw error;
    console.log(`Granted administrator access to ${email}`);
  }
}
main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
