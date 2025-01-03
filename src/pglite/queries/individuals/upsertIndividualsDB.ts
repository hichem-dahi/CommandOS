import type { Tables, TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertIndividualsDB(
  db: PGliteWithLive,
  individuals: TablesInsert<'individuals'>[]
) {
  if (!individuals?.length) return

  const query = `
    INSERT INTO public.individuals (id, name, phone, org_id, updated_at, _synced)
    VALUES ${individuals
      .map(
        (_, i) => `(
          COALESCE($${i * 6 + 1}, gen_random_uuid()), 
          $${i * 6 + 2}, 
          $${i * 6 + 3}, 
          $${i * 6 + 4}, 
          $${i * 6 + 5}, 
          COALESCE($${i * 6 + 6}, true)
        )` // Directly use the provided value, defaults to NULL if omitted
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      org_id = EXCLUDED.org_id,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  const values = individuals.flatMap((org) => [
    org.id,
    org.name,
    org.phone,
    org.org_id || null,
    org.updated_at || '0001-01-01 00:00:00+00', // Default to NULL if not provided
    org._synced ?? true // Default to true if not provided
  ])

  try {
    return db.query<Tables<'individuals'>>(query, values)
  } catch (error) {
    console.error('Error upserting organizations:', error)
  }
}
