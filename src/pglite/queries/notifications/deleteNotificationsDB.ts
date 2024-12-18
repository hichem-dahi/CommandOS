import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function deleteNotificationsDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    DELETE FROM public.notifications
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Pass the array properly formatted
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error deleting notifications with IDs ${ids.join(', ')}:`, error)
  }
}
