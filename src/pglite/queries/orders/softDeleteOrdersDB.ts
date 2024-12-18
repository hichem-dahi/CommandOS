import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function softDeleteOrdersDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    UPDATE public.orders
    SET _deleted = TRUE, 
        _synced = FALSE
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Execute the query with the provided IDs
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error soft-deleting orders with IDs ${ids.join(', ')}:`, error)
  }
}
