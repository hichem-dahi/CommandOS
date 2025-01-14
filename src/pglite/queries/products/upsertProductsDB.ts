import type { Tables, TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertProductsDB(db: PGliteWithLive, products: TablesInsert<'products'>[]) {
  if (!products?.length) return

  // Build the query for bulk upsert
  const query = `
    INSERT INTO public.products (id, code, name, price, cost_price, init_qty, org_id, bar_code, category_id, updated_at, _synced, _deleted)
    VALUES
    ${products
      .map(
        (_, i) => `(
          COALESCE($${i * 12 + 1}, gen_random_uuid()), 
          $${i * 12 + 2}, 
          $${i * 12 + 3}, 
          $${i * 12 + 4}, 
          $${i * 12 + 5}, 
          $${i * 12 + 6}, 
          $${i * 12 + 7}, 
          $${i * 12 + 8}, 
          $${i * 12 + 9}, 
          $${i * 12 + 10}, 
          COALESCE($${i * 12 + 11}, true),
          COALESCE($${i * 12 + 12}, false)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      cost_price = EXCLUDED.cost_price,
      init_qty = EXCLUDED.init_qty,
      org_id = EXCLUDED.org_id,
      bar_code = EXCLUDED.bar_code,
      category_id = EXCLUDED.category_id,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
      RETURNING *;
  `

  // Flatten the products array into the required values for query execution
  const queryValues = products.flatMap((product) => [
    product.id || null, // id
    product.code,
    product.name,
    product.price,
    product.cost_price,
    product.init_qty,
    product.org_id,
    product.bar_code || null, // Default to NULL if not provided
    product.category_id, // category_id
    product.updated_at || '0001-01-01 00:00:00+00', // Default to default date if not provided
    product._synced ?? true, // Default to true if not provided
    product._deleted ?? false // Default to false if not provided
  ])

  try {
    return db.query<Tables<'products'>>(query, queryValues)
  } catch (error) {
    throw new Error('Products not inserted/upserted successfully.')
  }
}
