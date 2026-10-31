// One-shot D1 setup for Cloudflare deploys.
//
//   npx wrangler login        (once, if you are not logged in)
//   pnpm run d1:setup
//
// 1. Finds the D1 database by name, or creates it.
// 2. Applies every SQL file in ./drizzle (tracked, so re-running is safe).
// 3. Prints the database id to put in the D1_DATABASE_ID build variable.

import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const name = process.env.D1_DATABASE_NAME || "site-creator-d1";
const isWindows = process.platform === "win32";

function wrangler(args, { capture = false } = {}) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    cwd: root,
    shell: isWindows,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
  });
  if (result.status !== 0) {
    console.error(`\n\`wrangler ${args.join(" ")}\` failed.`);
    process.exit(result.status ?? 1);
  }
  return result.stdout ?? "";
}

function findDatabase() {
  const list = JSON.parse(wrangler(["d1", "list", "--json"], { capture: true }));
  return list.find((db) => db.name === name);
}

let database = findDatabase();
if (database) {
  console.log(`Found D1 database "${name}" (${database.uuid}).`);
} else {
  console.log(`Creating D1 database "${name}"...`);
  wrangler(["d1", "create", name]);
  database = findDatabase();
  if (!database) {
    console.error(`Created "${name}" but could not find it afterwards.`);
    process.exit(1);
  }
}

// `d1 migrations apply` reads migrations_dir from a config file, so write a
// throwaway one that points at the drizzle folder.
const tempConfig = join(root, ".d1-setup.wrangler.json");
writeFileSync(
  tempConfig,
  JSON.stringify({
    name: "d1-setup",
    d1_databases: [
      {
        binding: "DB",
        database_name: name,
        database_id: database.uuid,
        migrations_dir: join(root, "drizzle"),
      },
    ],
  }),
);

try {
  console.log("Applying migrations...");
  wrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", tempConfig]);
} finally {
  rmSync(tempConfig, { force: true });
}

console.log(`
Done. Add this build variable in Cloudflare
(Workers & Pages > we-play-team-game > Settings > Build > Variables and secrets),
then retry the deployment:

  D1_DATABASE_ID = ${database.uuid}
${name === "site-creator-d1" ? "" : `  D1_DATABASE_NAME = ${name}\n`}`);
