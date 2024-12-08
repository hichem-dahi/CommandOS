import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export async function upsertOrganizationsDB(
  db: PGlite,
  organizations: (TablesInsert<'organizations'> & {
    _synced?: boolean
  })[]
) {
  const query = `
    INSERT INTO public.organizations (id, name, phone, rc, nif, nis, art, address, activity, org_id, updated_at, _synced)
    VALUES ${organizations
      .map(
        (_, i) => `(
          COALESCE($${i * 12 + 1}, gen_random_uuid()), 
          $${i * 12 + 2}, 
          $${i * 12 + 3}, 
          $${i * 12 + 4}, 
          $${i * 12 + 5}, 
          $${i * 12 + 6}, 
          $${i * 12 + 7}, 
          $${i * 12 + 8}, 
          $${i * 12 + 9}, 
          $${i * 12 + 10}, 
          $${i * 12 + 11},
          COALESCE($${i * 12 + 12}, true)
        )` // Directly use the provided value, defaults to NULL if omitted
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      rc = EXCLUDED.rc,
      nif = EXCLUDED.nif,
      nis = EXCLUDED.nis,
      art = EXCLUDED.art,
      address = EXCLUDED.address,
      activity = EXCLUDED.activity,
      org_id = EXCLUDED.org_id,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  const values = organizations.flatMap((org) => [
    org.id,
    org.name,
    org.phone,
    org.rc || null,
    org.nif || null,
    org.nis || null,
    org.art || null,
    org.address || null,
    org.activity || null,
    org.org_id || null,
    org.updated_at || null, // Default to NULL if not provided
    org._synced ?? true // Default to true if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting organizations:', error)
  }
}
