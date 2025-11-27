import type { PGliteWithLive } from '@electric-sql/pglite/live'
import type { TablesInsert } from '@/types/database.types'

export function upsertOrganizationDB(
  db: PGliteWithLive,
  organization: TablesInsert<'organizations'>
) {
  const query = `
    INSERT INTO public.organizations (id, name, phone, rc, nif, nis, art, address, activity, org_id, user_id, _synced, _deleted)
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
      $11,  
      COALESCE($12, true),
      COALESCE($13, false)
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
      user_id = EXCLUDED.user_id,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
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
    organization.user_id || null, // $11
    organization._synced ?? true, // $12
    organization._deleted ?? false // $13
  ]

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting organization:', error)
  }
}
