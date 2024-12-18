import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertNotificationsDB(
  db: PGliteWithLive,
  notifications: (TablesInsert<'notifications'> & {
    _synced?: boolean
  })[]
) {
  const query = `
    INSERT INTO public.notifications (
      id,
      org_id,
      title,
      body,
      updated_at,
      _synced
    )
    VALUES ${notifications
      .map(
        (_, i) => `(
          COALESCE($${i * 6 + 1}, gen_random_uuid()),
          $${i * 6 + 2},
          $${i * 6 + 3},
          $${i * 6 + 4},
          $${i * 6 + 5},
          COALESCE($${i * 6 + 6}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      org_id = EXCLUDED.org_id,
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true)
    RETURNING *;
  `

  const values = notifications.flatMap((notification) => [
    notification.id || null, // Defaults to NULL for id if not provided
    notification.org_id,
    notification.title,
    notification.body,
    notification.updated_at || null, // Defaults to NOW() in query if NULL
    notification._synced ?? true // Defaults to TRUE if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting notifications:', error)
    throw error
  }
}
