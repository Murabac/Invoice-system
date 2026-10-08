import fs from "fs";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Accept-Profile": "invoice",
};

const [docs, profiles] = await Promise.all([
  fetch(`${url}/rest/v1/documents?select=user_id,document_number,type`, {
    headers,
  }).then((r) => r.json()),
  fetch(`${url}/rest/v1/profiles?select=id,email`, { headers }).then((r) =>
    r.json()
  ),
]);

if (!Array.isArray(docs)) {
  console.error("documents query failed:", docs);
  process.exit(1);
}
if (!Array.isArray(profiles)) {
  console.error("profiles query failed:", profiles);
  process.exit(1);
}

const emailById = Object.fromEntries(profiles.map((p) => [p.id, p.email]));
const counts = {};
for (const d of docs) {
  const email = emailById[d.user_id] ?? d.user_id;
  counts[email] = (counts[email] ?? 0) + 1;
}

console.log(`Total documents in database: ${docs.length}`);
console.log("Documents per account:");
for (const [email, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n}  ${email}`);
}
console.log("Accounts with no documents:");
for (const p of profiles) {
  if (!counts[p.email]) console.log(`  ${p.email}`);
}
