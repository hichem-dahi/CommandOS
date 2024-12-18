import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function deleteIndividualDB(db: PGliteWithLive, individualId: string) {
  const query = `
    DELETE FROM public.individuals
    WHERE id = $1
  `

  try {
    const q = await db.query(query, [individualId])
    console.log(`individual with ID ${individualId} deleted successfully.`)
    return q
  } catch (error) {
    console.error(`Error deleting individual with ID ${individualId}:`, error)
  }
}
