import type { PGlite } from '@electric-sql/pglite'

export async function deleteOrdersDB(db: PGlite, ids: string[]) {
  const query = `
    DELETE FROM public.orders
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Pass the array properly formatted
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error deleting orderlines with IDs ${ids.join(', ')}:`, error)
  }
}
