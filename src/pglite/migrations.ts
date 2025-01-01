import type { PGlite } from '@electric-sql/pglite'

import m1 from './migrations/20241225203611_add_product_qty_table.sql?raw'
import m2 from './migrations/add_sync.sql?raw'

const migrations = [
  { name: '01-create_tables', sql: m1 },
  { name: '06-add_sync', sql: m2 }
]

export async function migrate(pg: PGlite) {
  // Create migrations table in the new schema
  await pg.exec(`
    CREATE SCHEMA IF NOT EXISTS migrations_schema;
    CREATE TABLE IF NOT EXISTS migrations_schema.migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Get list of applied migrations from the new schema
  const result = await pg.exec(`
    SELECT name FROM migrations_schema.migrations ORDER BY id;
  `)
  const appliedMigrations = result[0].rows.map((row) => row.name)

  // Apply new migrations
  for (const migration of migrations) {
    if (!appliedMigrations.includes(migration.name)) {
      await pg.exec(migration.sql)
      await pg.query(
        `
        INSERT INTO migrations_schema.migrations (name) 
        VALUES ($1);
        `,
        [migration.name]
      )
      console.log(`Applied migration: ${migration.name}`)
    }
  }
}
