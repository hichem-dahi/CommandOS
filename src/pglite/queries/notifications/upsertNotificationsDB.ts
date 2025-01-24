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
      url,        
      updated_at,
      _synced,
      _deleted
    )
    VALUES ${notifications
      .map(
        (_, i) => `(
          COALESCE($${i * 8 + 1}, gen_random_uuid()),
          $${i * 8 + 2},
          $${i * 8 + 3},
          $${i * 8 + 4},
          $${i * 8 + 5},
          $${i * 8 + 6},
          COALESCE($${i * 8 + 7}, true),
          COALESCE($${i * 8 + 8}, false)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      org_id = EXCLUDED.org_id,
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      url = EXCLUDED.url,  -- Update URL on conflict
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
    RETURNING *;
  `

  const values = notifications.flatMap((notification) => [
    notification.id || null, // Defaults to NULL for id if not provided
    notification.org_id,
    notification.title,
    notification.body,
    notification.url || null, // Add URL field, defaulting to NULL if not provided
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
