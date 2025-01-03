import type { Tables, TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertDeliveriesDB(
  db: PGliteWithLive,
  deliveries: TablesInsert<'deliveries'>[] // Include org_id in the parameter type
) {
  if (!deliveries?.length) return
  const query = `
    INSERT INTO public.deliveries (
      id,
      destination,
      driver_name,
      license_plate,
      phone,
      org_id,      
      updated_at,
      _synced
    )
    VALUES ${deliveries
      .map(
        (_, i) => `(
          COALESCE($${i * 8 + 1}, gen_random_uuid()), 
          $${i * 8 + 2}, 
          $${i * 8 + 3}, 
          $${i * 8 + 4}, 
          $${i * 8 + 5}, 
          $${i * 8 + 6},  -- Added org_id value
          $${i * 8 + 7}, 
          COALESCE($${i * 8 + 8}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      destination = EXCLUDED.destination,
      driver_name = EXCLUDED.driver_name,
      license_plate = EXCLUDED.license_plate,
      phone = EXCLUDED.phone,
      org_id = EXCLUDED.org_id, -- Update org_id in case of conflict
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
    delivery.org_id, // Including org_id before updated_at
    delivery.updated_at || '0001-01-01 00:00:00+00', // Default to NULL if not provided
    delivery._synced ?? true // Default to true if not provided
  ])

  try {
    return await db.query<Tables<'deliveries'>>(query, values)
  } catch (error) {
    console.error('Error upserting deliveries:', error)
  }
}
