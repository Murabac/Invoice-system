/**
 * Lists and deletes junk Supabase auth users (rsy.*@hotmail.com).
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Usage: node scripts/delete-junk-users.mjs
 *        node scripts/delete-junk-users.mjs --confirm
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i)] = line.slice(i + 1);
  }
  return env;
}

const confirm = process.argv.includes("--confirm");
const env = loadEnv();
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!baseUrl || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const keepEmails = new Set(["admin@gmail.com", "info@m2btek.com"]);

async function listAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const res = await fetch(
      `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Auth list failed: ${res.status} ${await res.text()}`);
    }
    const batch = await res.json();
    if (!batch.users?.length) break;
    users.push(...batch.users);
    if (batch.users.length < perPage) break;
    page += 1;
  }
  return users;
}

async function deleteUser(id) {
  const res = await fetch(`${baseUrl}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Delete ${id} failed: ${res.status} ${await res.text()}`);
  }
}

const junkPattern = /^rsy\.\d+@hotmail\.com$/i;

const users = await listAuthUsers();
const candidates = users.filter((u) => {
  const email = (u.email ?? "").toLowerCase();
  if (keepEmails.has(email)) return false;
  if (junkPattern.test(email)) return true;
  return false;
});

console.log(`Found ${users.length} auth users, ${candidates.length} junk candidates:`);
for (const u of candidates) {
  console.log(`  - ${u.email} (${u.id})`);
}

if (!confirm) {
  console.log("\nDry run. Re-run with --confirm to delete.");
  process.exit(0);
}

for (const u of candidates) {
  await deleteUser(u.id);
  console.log(`Deleted ${u.email}`);
}

console.log("Done.");
