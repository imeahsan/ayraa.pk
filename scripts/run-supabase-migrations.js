"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("../node_modules/pg");

const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const MIGRATION_TABLE = "public.app_schema_migrations";

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    let [, key, value] = match;
    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function parseArgs(argv) {
  const args = { target: "current", baseline: false };

  for (const arg of argv) {
    if (arg.startsWith("--target=")) {
      args.target = arg.split("=")[1];
    } else if (arg === "--baseline") {
      args.baseline = true;
    }
  }

  return args;
}

function getTargetConfig(env, target) {
  const config = {
    current: {
      label: "current",
      dbUrl: env.SUPABASE_DB_URL,
      projectUrl: env.NEXT_PUBLIC_SUPABASE_URL || "unknown",
    },
    beta: {
      label: "beta",
      dbUrl: env.BETA_SUPABASE_DB_URL || env.SUPABASE_DB_URL,
      projectUrl:
        env.BETA_NEXT_PUBLIC_SUPABASE_URL ||
        env.NEXT_PUBLIC_SUPABASE_URL ||
        "unknown",
    },
    prod: {
      label: "prod",
      dbUrl: env.PROD_SUPABASE_DB_URL,
      projectUrl: env.PROD_NEXT_PUBLIC_SUPABASE_URL || "unknown",
    },
  }[target];

  if (!config) {
    throw new Error(`Unknown target "${target}". Use current, beta, or prod.`);
  }

  if (!config.dbUrl) {
    throw new Error(
      `Missing database URL for target "${target}". Add it in .env.local.`
    );
  }

  return config;
}

function parseConnectionString(connectionString) {
  const match = connectionString.match(
    /^postgresql:\/\/([^:]+):(.*)@([^:]+):(\d+)\/(.+)$/
  );

  if (!match) {
    throw new Error("Failed to parse database connection string.");
  }

  const [, user, password, host, port, database] = match;
  return {
    user,
    password,
    host,
    port: Number(port),
    database,
    ssl: { rejectUnauthorized: false },
  };
}

function loadMigrations() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => !/seed/i.test(name))
    .sort()
    .map((name) => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      return {
        name,
        sql,
        checksum: crypto.createHash("sha256").update(sql).digest("hex"),
      };
    });
}

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists ${MIGRATION_TABLE} (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    );
  `);
}

async function loadAppliedMigrations(client) {
  const result = await client.query(
    `select name, checksum from ${MIGRATION_TABLE} order by name asc`
  );
  return new Map(result.rows.map((row) => [row.name, row.checksum]));
}

async function saveMigrationRecord(client, migration) {
  await client.query(
    `insert into ${MIGRATION_TABLE} (name, checksum)
     values ($1, $2)
     on conflict (name) do update
     set checksum = excluded.checksum,
         applied_at = now()`,
    [migration.name, migration.checksum]
  );
}

async function main() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(".env.local not found.");
  }

  const env = parseEnvFile(ENV_PATH);
  const args = parseArgs(process.argv.slice(2));
  const target = getTargetConfig(env, args.target);
  const migrations = loadMigrations();

  console.log(`Target: ${target.label}`);
  console.log(`Project: ${target.projectUrl}`);
  console.log(`Mode: ${args.baseline ? "baseline" : "apply"}`);
  console.log(`Non-seed migrations: ${migrations.length}`);

  const client = new Client(parseConnectionString(target.dbUrl));
  await client.connect();

  try {
    await ensureMigrationTable(client);
    const applied = await loadAppliedMigrations(client);
    let changed = 0;

    for (const migration of migrations) {
      const appliedChecksum = applied.get(migration.name);

      if (appliedChecksum) {
        if (appliedChecksum !== migration.checksum) {
          throw new Error(
            `Checksum mismatch for ${migration.name}. Old migrations must stay immutable.`
          );
        }
        console.log(`Skip ${migration.name}`);
        continue;
      }

      if (args.baseline) {
        await saveMigrationRecord(client, migration);
        console.log(`Baseline ${migration.name}`);
        changed += 1;
        continue;
      }

      console.log(`Apply ${migration.name}`);
      await client.query(migration.sql);
      await saveMigrationRecord(client, migration);
      changed += 1;
    }

    if (changed === 0) {
      console.log("No pending non-seed migrations.");
    } else {
      console.log(`Completed ${changed} migration action(s).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
