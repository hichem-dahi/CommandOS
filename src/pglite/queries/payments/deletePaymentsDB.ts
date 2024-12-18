import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function deletePaymentsDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    DELETE FROM public.payments
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Execute query with array of IDs
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error deleting payments with IDs ${ids.join(', ')}:`, error)
  }
}
