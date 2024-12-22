import type { Tables, TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertOrdersDB(db: PGliteWithLive, orders: TablesInsert<'orders'>[]) {
  if (!orders?.length) return

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
      _synced,
      _deleted
    )
    VALUES ${orders
      .map(
        (_, i) => `(
          COALESCE($${i * 18 + 1}, gen_random_uuid()),
          $${i * 18 + 2},
          $${i * 18 + 3},
          $${i * 18 + 4},
          $${i * 18 + 5},
          $${i * 18 + 6},
          $${i * 18 + 7},
          $${i * 18 + 8},
          $${i * 18 + 9},
          $${i * 18 + 10},
          $${i * 18 + 11},
          $${i * 18 + 12},
          $${i * 18 + 13},
          $${i * 18 + 14},
          $${i * 18 + 15},
          $${i * 18 + 16},
          COALESCE($${i * 18 + 17}, true),
          COALESCE($${i * 18 + 18}, false)
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
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
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
    order._synced ?? true,
    order._deleted ?? false
  ])

  try {
    return db.query<Tables<'orders'>>(query, values)
  } catch (error) {
    console.error('Error upserting orders:', error)
  }
}
