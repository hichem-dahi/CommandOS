import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export async function upsertPaymentsDB(
  db: PGlite,
  payments: (TablesInsert<'payments'> & {
    _synced?: boolean
  })[]
) {
  const query = `
    INSERT INTO public.payments (
      id,
      amount,
      date,
      order_id,
      _synced
    )
    VALUES ${payments
      .map(
        (_, i) => `(
          COALESCE($${i * 5 + 1}, gen_random_uuid()), 
          $${i * 5 + 2}, 
          $${i * 5 + 3}, 
          $${i * 5 + 4}, 
          COALESCE($${i * 5 + 5}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      date = EXCLUDED.date,
      order_id = EXCLUDED.order_id,
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  const values = payments.flatMap((payment) => [
    payment.id || null,
    payment.amount,
    payment.date,
    payment.order_id,
    payment._synced ?? true // Default to true if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting payments:', error)
  }
}
