import type { PGlite } from '@electric-sql/pglite'
import type { Organization } from '@/models/models'

export async function upsertOrganization(db: PGlite, organization: Organization) {
  const query = `
    INSERT INTO public.organizations (id, name, phone, rc, nif, nis, art, address, activity, org_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    org_id = EXCLUDED.org_id
  `

  try {
    await db.query(query, [
      organization.id,
      organization.name,
      organization.phone,
      organization.rc || null,
      organization.nif || null,
      organization.nis || null,
      organization.art || null,
      organization.address || null,
      organization.activity || null,
      organization.org_id || null
    ])
    console.log('Organization upserted successfully.')
  } catch (error) {
    console.error('Error upserting organization:', error)
  }
}
