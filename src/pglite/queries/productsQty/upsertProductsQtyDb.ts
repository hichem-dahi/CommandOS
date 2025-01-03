import type { Tables, TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertProductQtyDB(
  db: PGliteWithLive,
  productQty: TablesInsert<'products_qty'>[]
) {
  if (!productQty?.length) return

  const query = `
    INSERT INTO public.products_qty (
      id,
      org_id,
      qty,
      updated_at,
      _deleted,
      _synced
    )
    VALUES ${productQty
      .map(
        (_, i) => `(
          $${i * 6 + 1}, 
          $${i * 6 + 2}, 
          $${i * 6 + 3}, 
          $${i * 6 + 4}, 
          $${i * 6 + 5}, 
          $${i * 6 + 6}
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      qty = EXCLUDED.qty,
      updated_at = EXCLUDED.updated_at,
      _deleted = COALESCE(EXCLUDED._deleted, false),
      _synced = COALESCE(EXCLUDED._synced, true)
    RETURNING *;
  `

  const values = productQty.flatMap((entry) => [
    entry.id,
    entry.org_id, // Ensure org_id is included
    entry.qty,
    entry.updated_at || '0001-01-01 00:00:00+00', // Default to current timestamp if not provided
    entry._deleted ?? false, // Default to false if not provided
    entry._synced ?? true // Default to true if not provided
  ])

  try {
    // Execute query and return the results
    const result = await db.query<Tables<'products_qty'>>(query, values)
    return result
  } catch (error) {
    console.error('Error upserting product quantities:', error)
    throw error
  }
}
