import type { TablesInsert } from '@/types/database.types'
import type { PGlite } from '@electric-sql/pglite'

export async function upsertOrdersDB(
  db: PGlite,
  orders: (TablesInsert<'orders'> & { _synced: boolean })[]
) {
  const query = `
    INSERT INTO public.orders (
      id,
      client_id,
      date,
      delivery_id,
      doc_index,
      document_type,
      index,
      individual_id,
      org_id,
      paid_price,
      payment_method,
      status,
      total_price,
      ttc,
      tva,
      updated_at,
      _synced
    )
    VALUES ${orders
      .map(
        (_, i) => `(
          COALESCE($${i * 17 + 1}, gen_random_uuid()),
          $${i * 17 + 2},
          $${i * 17 + 3},
          $${i * 17 + 4},
          $${i * 17 + 5},
          $${i * 17 + 6},
          $${i * 17 + 7},
          $${i * 17 + 8},
          $${i * 17 + 9},
          $${i * 17 + 10},
          $${i * 17 + 11},
          $${i * 17 + 12},
          $${i * 17 + 13},
          $${i * 17 + 14},
          $${i * 17 + 15},
          $${i * 17 + 16},
          COALESCE($${i * 17 + 17}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      client_id = EXCLUDED.client_id,
      date = EXCLUDED.date,
      delivery_id = EXCLUDED.delivery_id,
      doc_index = EXCLUDED.doc_index,
      document_type = EXCLUDED.document_type,
      index = EXCLUDED.index,
      individual_id = EXCLUDED.individual_id,
      org_id = EXCLUDED.org_id,
      paid_price = EXCLUDED.paid_price,
      payment_method = EXCLUDED.payment_method,
      status = EXCLUDED.status,
      total_price = EXCLUDED.total_price,
      ttc = EXCLUDED.ttc,
      tva = EXCLUDED.tva,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  const values = orders.flatMap((order) => [
    order.id || null,
    order.client_id || null,
    order.date,
    order.delivery_id || null,
    order.doc_index || null,
    order.document_type,
    order.index || null,
    order.individual_id || null,
    order.org_id,
    order.paid_price,
    order.payment_method || null,
    order.status,
    order.total_price,
    order.ttc || null,
    order.tva || null,
    order.updated_at || null,
    order._synced ?? true
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting orders:', error)
  }
}
