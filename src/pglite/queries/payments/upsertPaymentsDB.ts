import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertPaymentsDB(db: PGliteWithLive, payments: TablesInsert<'payments'>[]) {
  const query = `
    INSERT INTO public.payments (
      id,
      amount,
      date,
      order_id,
      _synced,
      _deleted
    )
    VALUES ${payments
      .map(
        (_, i) => `(
          COALESCE($${i * 6 + 1}, gen_random_uuid()), 
          $${i * 6 + 2}, 
          $${i * 6 + 3}, 
          $${i * 6 + 4}, 
          COALESCE($${i * 6 + 5}, true),
          COALESCE($${i * 6 + 6}, false)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      date = EXCLUDED.date,
      order_id = EXCLUDED.order_id,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
      RETURNING *;
  `

  const values = payments.flatMap((payment) => [
    payment.id || null,
    payment.amount,
    payment.date,
    payment.order_id,
    payment._synced ?? true, // Default `_synced` to true if not provided
    payment._deleted ?? false // Default `_deleted` to false if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting payments:', error)
  }
}
