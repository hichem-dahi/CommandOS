import type { PGlite } from '@electric-sql/pglite'
import type { Tables, TablesInsert } from '@/types/database.types'

export async function upsertDeliveriesDB(
  db: PGlite,
  deliveries: (TablesInsert<'deliveries'> & {
    _synced?: boolean
  })[]
) {
  const query = `
    INSERT INTO public.deliveries (
      id,
      destination,
      driver_name,
      license_plate,
      phone,
      updated_at,
      _synced
    )
    VALUES ${deliveries
      .map(
        (_, i) => `(
          COALESCE($${i * 7 + 1}, gen_random_uuid()), 
          $${i * 7 + 2}, 
          $${i * 7 + 3}, 
          $${i * 7 + 4}, 
          $${i * 7 + 5}, 
          $${i * 7 + 6}, 
          COALESCE($${i * 7 + 7}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      destination = EXCLUDED.destination,
      driver_name = EXCLUDED.driver_name,
      license_plate = EXCLUDED.license_plate,
      phone = EXCLUDED.phone,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  const values = deliveries.flatMap((delivery) => [
    delivery.id || null,
    delivery.destination,
    delivery.driver_name,
    delivery.license_plate,
    delivery.phone || null,
    delivery.updated_at || null, // Default to NULL if not provided
    delivery._synced ?? true // Default to true if not provided
  ])

  try {
    return await db.query<Tables<'deliveries'>>(query, values)
  } catch (error) {
    console.error('Error upserting deliveries:', error)
  }
}
