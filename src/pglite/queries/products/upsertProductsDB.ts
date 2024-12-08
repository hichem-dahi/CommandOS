import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export async function upsertProductsDB(
  db: PGlite,
  products: (TablesInsert<'products'> & { _synced?: boolean })[]
) {
  // Build the query for bulk upsert
  const query = `
    INSERT INTO public.products (id, code, name, price, cost_price, qte, org_id, bar_code, updated_at, _synced)
    VALUES
    ${products
      .map(
        (_, i) => `(
          COALESCE($${i * 10 + 1}, gen_random_uuid()), 
          $${i * 10 + 2}, 
          $${i * 10 + 3}, 
          $${i * 10 + 4}, 
          $${i * 10 + 5}, 
          $${i * 10 + 6}, 
          $${i * 10 + 7}, 
          $${i * 10 + 8}, 
          $${i * 10 + 9},
          COALESCE($${i * 10 + 10}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      code = EXCLUDED.code,
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      cost_price = EXCLUDED.cost_price,
      qte = EXCLUDED.qte,
      org_id = EXCLUDED.org_id,
      bar_code = EXCLUDED.bar_code,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  // Flatten the products array into the required values for query execution
  const queryValues = products.flatMap((product) => [
    product.id || null, // id
    product.code,
    product.name,
    product.price,
    product.cost_price,
    product.qte,
    product.org_id,
    product.bar_code || null,
    product.updated_at || null, // Default to NULL if not provided
    product._synced ?? true // Default to true if not provided
  ])
  try {
    return await db.query(query, queryValues)
  } catch (error) {
    throw new Error('Products not inserted/upserted successfully.')
  }
}
