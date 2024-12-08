import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export function upsertOrganizationDB(
  db: PGlite,
  organization: TablesInsert<'organizations'> & { _synced?: boolean }
) {
  const query = `
    INSERT INTO public.organizations (id, name, phone, rc, nif, nis, art, address, activity, org_id, _synced)
    VALUES (
      COALESCE($1, gen_random_uuid()), 
      $2, 
      $3, 
      $4, 
      $5, 
      $6, 
      $7, 
      $8, 
      $9, 
      $10, 
      COALESCE($11, true)
    )
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
      _synced = COALESCE(EXCLUDED._synced, true)
      RETURNING *;
  `

  const values = [
    organization.id, // $1
    organization.name, // $2
    organization.phone, // $3
    organization.rc || null, // $4
    organization.nif || null, // $5
    organization.nis || null, // $6
    organization.art || null, // $7
    organization.address || null, // $8
    organization.activity || null, // $9
    organization.org_id || null, // $10
    organization._synced ?? true // $11
  ]

  try {
    return db.query(query, values)
    console.log('Organization upserted successfully.')
  } catch (error) {
    console.error('Error upserting organization:', error)
  }
}
