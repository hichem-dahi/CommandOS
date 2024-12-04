import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export async function upsertProductsDB(
  db: PGlite,
  products: (TablesInsert<'products'> & { _synced?: boolean })[]
) {
  // Build the query for bulk upsert
  const query = `
    INSERT INTO public.products (id, code, name, price, cost_price, qte, org_id, bar_code, _synced)
    VALUES
    ${products
      .map(
        (_, index) =>
          `(COALESCE($${index * 9 + 1}, gen_random_uuid()), $${index * 9 + 2}, $${index * 9 + 3}, $${index * 9 + 4}, $${index * 9 + 5}, $${index * 9 + 6}, $${index * 9 + 7}, $${index * 9 + 8}, COALESCE($${index * 9 + 9}, true))`
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
      _synced = COALESCE(EXCLUDED._synced, true);
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
    product._synced ?? true // sync value
  ])

  try {
    return await db.query(query, queryValues)
  } catch (error) {
    throw new Error('Products not inserted/upserted successfully.')
  }
}
