import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertNotificationsDB(
  db: PGliteWithLive,
  notifications: TablesInsert<'notifications'>[]
) {
  if (!notifications?.length) return

  const query = `
    INSERT INTO public.notifications (
      id,
      org_id,
      title,
      body,
      updated_at,
      _synced,
      _deleted
    )
    VALUES ${notifications
      .map(
        (_, i) => `(
          COALESCE($${i * 7 + 1}, gen_random_uuid()),
          $${i * 7 + 2},
          $${i * 7 + 3},
          $${i * 7 + 4},
          $${i * 7 + 5},
          COALESCE($${i * 7 + 6}, true),
          COALESCE($${i * 7 + 7}, false)  -- Default _deleted to false if not provided
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      org_id = EXCLUDED.org_id,
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false) -- Update _deleted on conflict
    RETURNING *;
  `

  const values = notifications.flatMap((notification) => [
    notification.id || null, // Defaults to NULL for id if not provided
    notification.org_id,
    notification.title,
    notification.body,
    notification.updated_at || '0001-01-01 00:00:00+00', // Defaults to NOW() in query if NULL
    notification._synced ?? true, // Defaults to TRUE if not provided
    notification._deleted ?? false // Default _deleted to false if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting notifications:', error)
    throw error
  }
}
