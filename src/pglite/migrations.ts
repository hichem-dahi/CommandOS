import type { PGlite } from '@electric-sql/pglite'

import m1 from './migrations/20241225203611_add_product_qty_table.sql?raw'
import m2 from './migrations/20250103130839_add_org_id.sql?raw'
import m3 from './migrations/20250112131109_remove_order_index.sql?raw'
import m4 from './migrations/20250113190416_add_products_categories_table.sql?raw'
import m5 from './migrations/20250122182527_add_order_sale_type.sql?raw'
import m6 from './migrations/20250124174156_add_url_field_notifications.sql?raw'
import m7 from './migrations/20250215120204_add_reduction_field_to_order.sql?raw'
import m8 from './migrations/add_sync.sql?raw'

const migrations = [
  { name: '01-create_tables', sql: m1 },
  { name: '02-add_org_id', sql: m2 },
  { name: '03-remove_order_index', sql: m3 },
  { name: '04-add_category_field_products', sql: m4 },
  { name: '05-add_order_sale_type', sql: m5 },
  { name: '06-add_url_field_notifications', sql: m6 },
  { name: '07-add_reduction_field_to_order', sql: m7 },
  { name: '08-add_sync', sql: m8 }
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
