import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertOrganizationsDB(
  db: PGliteWithLive,
  organizations: TablesInsert<'organizations'>[]
) {
  if (!organizations?.length) return

  const query = `
    INSERT INTO public.organizations (
      id, name, phone, rc, nif, nis, art, address, activity, org_id, updated_at, _synced, _deleted
    )
    VALUES ${organizations
      .map(
        (_, i) => `(
          COALESCE($${i * 13 + 1}, gen_random_uuid()), 
          $${i * 13 + 2}, 
          $${i * 13 + 3}, 
          $${i * 13 + 4}, 
          $${i * 13 + 5}, 
          $${i * 13 + 6}, 
          $${i * 13 + 7}, 
          $${i * 13 + 8}, 
          $${i * 13 + 9}, 
          $${i * 13 + 10}, 
          $${i * 13 + 11}, 
          COALESCE($${i * 13 + 12}, true),
          COALESCE($${i * 13 + 13}, false)  -- Default _deleted to false if not provided
        )`
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
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false) -- Update _deleted on conflict
    RETURNING *;
  `

  const values = organizations.flatMap((org) => [
    org.id,
    org.name,
    org.phone,
    org.rc || null, // Optional field, default to null
    org.nif || null, // Optional field, default to null
    org.nis || null, // Optional field, default to null
    org.art || null, // Optional field, default to null
    org.address || null, // Optional field, default to null
    org.activity || null, // Optional field, default to null
    org.org_id || null, // Optional field, default to null
    org.updated_at || null, // Optional field, default to null
    org._synced ?? true, // Default to true if not provided
    org._deleted ?? false // Default to false if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting organizations:', error)
  }
}
