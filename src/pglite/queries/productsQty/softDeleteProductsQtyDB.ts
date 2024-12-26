import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function softDeleteProductsDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    UPDATE public.products_qty
    SET _deleted = TRUE, 
        _synced = FALSE
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Execute the query with the provided IDs
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error soft-deleting ProductsQty with IDs ${ids.join(', ')}:`, error)
  }
}
