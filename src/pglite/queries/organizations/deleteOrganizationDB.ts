import type { PGlite } from '@electric-sql/pglite'

export async function deleteOrganizationDB(db: PGlite, organizationId: string) {
  const query = `
    DELETE FROM public.organizations
    WHERE id = $1
  `

  try {
    const q = await db.query(query, [organizationId])
    console.log(`organization with ID ${organizationId} deleted successfully.`)
    return q
  } catch (error) {
    console.error(`Error deleting organization with ID ${organizationId}:`, error)
  }
}
