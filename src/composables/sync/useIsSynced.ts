import { computed } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import { TABLES } from '@/sync/syncTables'

export function useIsSynced() {
  const counts = useLiveQuery(
    `
      SELECT table_name, COUNT(*) as count 
      FROM (
        ${TABLES.map(
          (table) => `
          SELECT '${table}' as table_name 
          FROM public.${table} 
          WHERE _synced = false
        `
        ).join(' UNION ALL ')}
      ) subquery
      GROUP BY table_name
    `,
    []
  )

  const isSynced = computed(() => counts.rows.value?.length === 0)

  return { isSynced }
}
