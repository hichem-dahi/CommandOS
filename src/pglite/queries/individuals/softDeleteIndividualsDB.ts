import type { PGlite } from '@electric-sql/pglite'

export async function softDeleteIndividualsDB(db: PGlite, ids: string[]) {
  const query = `
    UPDATE public.individuals
    SET _deleted = TRUE, 
        _synced = FALSE
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Execute the query with the provided IDs
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error soft-deleting individuals with IDs ${ids.join(', ')}:`, error)
  }
}
