import type { PGlite } from '@electric-sql/pglite'

export async function softDeleteOrderlinesDB(db: PGlite, ids: string[]) {
  const query = `
    UPDATE public.order_lines
    SET _deleted = TRUE, 
        _synced = FALSE
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Execute the query with the provided IDs
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error soft-deleting orderlines with IDs ${ids.join(', ')}:`, error)
  }
}
