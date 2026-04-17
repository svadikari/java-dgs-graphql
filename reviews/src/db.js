import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";

function loadLocalEnv() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(currentDir, "..", ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const envContent = readFileSync(envPath, "utf8");

  for (const rawLine of envContent.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return undefined;
  }

  if (databaseUrl.startsWith("jdbc:postgresql://")) {
    return databaseUrl.replace("jdbc:postgresql://", "postgresql://");
  }

  return databaseUrl;
}

function buildPoolConfig() {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

  if (connectionString) {
    const url = new URL(connectionString);

    if (!url.username && process.env.PGUSER) {
      url.username = process.env.PGUSER;
    }

    if (!url.password && process.env.PGPASSWORD) {
      url.password = process.env.PGPASSWORD;
    }

    return {
      connectionString: url.toString()
    };
  }

  return {
    host: process.env.PGHOST ?? "localhost",
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE ?? "reviews",
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "postgres"
  };
}

function formatDatabaseError(error) {
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors
      .map((item) => {
        const parts = [item.code, item.message].filter(Boolean);
        return parts.length > 0 ? parts.join(": ") : String(item);
      })
      .join("; ");
  }

  if (error?.code && error?.message) {
    return `${error.code}: ${error.message}`;
  }

  if (error?.message) {
    return error.message;
  }

  return String(error);
}

loadLocalEnv();

const poolConfig = buildPoolConfig();
const pool = new Pool(poolConfig);

async function getReviewColumns() {
  const { rows } = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'reviews'
    `
  );

  return new Set(rows.map((row) => row.column_name));
}

function isConnectionError(error) {
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors.every((item) => isConnectionError(item));
  }

  const connectionCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "EPERM",
    "57P01"
  ]);

  return connectionCodes.has(error?.code) || String(error?.message ?? "").includes("connect ");
}

export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        reviewer TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const columns = await getReviewColumns();

    if (!columns.has("entity_id")) {
      await pool.query(`
        ALTER TABLE reviews
        ADD COLUMN entity_id TEXT
      `);
      columns.add("entity_id");
    }

    if (!columns.has("entityId")) {
      await pool.query(`
        ALTER TABLE reviews
        ADD COLUMN entityId TEXT
      `);
      columns.add("entityId");
    }

    if (
      columns.has("entity_type") &&
      columns.has("entity_id") &&
      columns.has("entityId")
    ) {
      await pool.query(`
        UPDATE reviews
        SET entityId = CONCAT(entity_type, ':', entity_id)
        WHERE entityId IS NULL
          AND entity_type IS NOT NULL
          AND entity_id IS NOT NULL
      `);
    }

    if (columns.has("book_id") && columns.has("entityId")) {
      await pool.query(`
        UPDATE reviews
        SET entityId = CONCAT('book', ':', book_id)
        WHERE entityId IS NULL AND book_id IS NOT NULL
      `);
    }

    if (columns.has("entity_id") && columns.has("entityId")) {
      await pool.query(`
        UPDATE reviews
        SET entity_id = entityId
        WHERE entityId IS NOT NULL
          AND entity_id IS DISTINCT FROM entityId
      `);
    }

    await pool.query(`
      ALTER TABLE reviews
      ALTER COLUMN entity_id SET NOT NULL
    `);

    await pool.query(`
      DROP INDEX IF EXISTS reviews_book_id_idx
    `);

    await pool.query(`
      DROP INDEX IF EXISTS reviews_entity_lookup_idx
    `);

    await pool.query(`
      DROP INDEX IF EXISTS reviews_entityId_idx
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS reviews_entity_id_idx
      ON reviews (entity_id)
    `);

    await pool.query(`
      ALTER TABLE reviews
      DROP COLUMN IF EXISTS entity_type
    `);

    await pool.query(`
      ALTER TABLE reviews
      DROP COLUMN IF EXISTS entityId
    `);

    await pool.query(`
      ALTER TABLE reviews
      DROP COLUMN IF EXISTS book_id
    `);
  } catch (error) {
    const connectionTarget = poolConfig.connectionString
      ? (() => {
          const url = new URL(poolConfig.connectionString);
          return {
            host: url.hostname,
            port: url.port || "5432",
            pathname: url.pathname
          };
        })()
      : {
          host: poolConfig.host,
          port: poolConfig.port,
          pathname: `/${poolConfig.database}`
        };

    if (isConnectionError(error)) {
      throw new Error(
        `Unable to connect to PostgreSQL using .env.local/.env vars. ` +
          `Check DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD, ` +
          `and make sure PostgreSQL is running on ${connectionTarget.host}:${connectionTarget.port}` +
          `${connectionTarget.pathname}. ` +
          `Original error: ${formatDatabaseError(error)}`
      );
    }

    throw new Error(
      `Unable to initialize the PostgreSQL reviews schema on ` +
        `${connectionTarget.host}:${connectionTarget.port}${connectionTarget.pathname}. ` +
        `Original error: ${formatDatabaseError(error)}`
    );
  }
}

export async function closeDatabase() {
  await pool.end();
}

export { pool };
