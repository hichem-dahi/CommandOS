import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertPaymentsDB(db: PGliteWithLive, payments: TablesInsert<'payments'>[]) {
  if (!payments?.length) return

  const query = `
    INSERT INTO public.payments (
      id,
      amount,
      date,
      order_id,
      org_id,
      updated_at,
      _synced,
      _deleted
    )
    VALUES ${payments
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
      amount = EXCLUDED.amount,
      date = EXCLUDED.date,
      order_id = EXCLUDED.order_id,
      org_id = EXCLUDED.org_id,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
      RETURNING *;
  `

  const values = payments.flatMap((payment) => [
    payment.id || null,
    payment.amount,
    payment.date,
    payment.order_id,
    payment.org_id,
    payment.updated_at || '0001-01-01 00:00:00+00',
    payment._synced ?? true, // Default `_synced` to true if not provided
    payment._deleted ?? false // Default `_deleted` to false if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting payments:', error)
  }
}
