import { injectPGlite } from '@electric-sql/pglite-vue'
import { supabase } from '@/supabase/supabase'

import self from '../localStore/useSelf'

import type { Tables, TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

const TABLES = [
  'deliveries',
  'individuals',
  'organizations',
  'products',
  'orders',
  'order_lines',
  'payments',
  'stock_movements',
  'products_qty',
  'notifications'
] as const

type TablesName = (typeof TABLES)[number]

interface QueryParams {
  date?: string
  orderBy?: 'asc' | 'desc'
}

interface QueryResponse<T> {
  data: T[] | null
  error: Error | null
}

export interface MaxDateResult {
  max_date: string | null
}

async function pullTableData<T extends TablesName>(tableName: T, params: QueryParams = {}) {
  const orgId = self.value.current_org?.id

  if (!orgId) {
    return {
      data: null,
      error: new Error('Organization ID is required')
    }
  }

  try {
    let query = supabase
      .from(tableName)
      .select()
      .eq('org_id', orgId)
      .order('updated_at', { ascending: params.orderBy === 'asc' })

    if (params.date) {
      query = query.gt('updated_at', params.date)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error(`Error pulling data from ${tableName}:`, error)
    return { data: null, error: error as Error }
  }
}

async function pushTableData(
  tableName: TablesName,
  data: TablesInsert<TablesName>[]
): Promise<QueryResponse<Tables<TablesName>>> {
  if (!data.length) {
    return { data: null, error: new Error('No data provided for upload') }
  }

  try {
    // Type assertion to help TypeScript understand the type relationship
    const { data: response, error } = await supabase.from(tableName).upsert(data).select()

    if (error) throw error

    return { data: response, error: null }
  } catch (error) {
    console.error(`Error pushing data to ${tableName}:`, error)
    return { data: null, error: error as Error }
  }
}

export async function upsertDataDB(
  db: PGliteWithLive,
  data: Tables<TablesName>[],
  tableName: TablesName
) {
  if (!data?.length) {
    return { data: null, error: new Error('No data provided for upsert') }
  }

  const keys = Object.keys(data[0])

  try {
    const query = buildUpsertQuery(tableName, keys, data.length)
    const values = data.flatMap((d) => Object.values(d))

    const result = await db.query<Tables<TablesName>>(query, values)
    return { data: result, error: null }
  } catch (error) {
    console.error(`Error upserting ${tableName}:`, error)
    return { data: null, error: error as Error }
  }
}

function buildUpsertQuery<T extends TablesName>(
  tableName: T,
  keys: string[],
  rowCount: number
): string {
  const valueGroups = Array.from({ length: rowCount }, (_, i) => {
    const offset = i * keys.length
    return `(${keys.map((_, j) => `$${offset + j + 1}`).join(', ')})`
  }).join(', ')

  const updateSetClauses = keys.map((key) => `${key} = EXCLUDED.${key}`)

  return `
    INSERT INTO public.${tableName} (${keys.join(', ')})
    VALUES ${valueGroups}
    ON CONFLICT (id)
    DO UPDATE SET
      ${updateSetClauses.join(',\n      ')}
    RETURNING *;
  `
}

export async function useSyncTables(selectedTables: TablesName[] = [...TABLES]) {
  const db = injectPGlite()
  const results: Partial<Record<TablesName, QueryResponse<Tables<TablesName>>>> = {}

  for (const tableName of selectedTables) {
    const dataToSyncQuery = await db?.query<Tables<TablesName>>(
      `SELECT * FROM public.${tableName} WHERE _synced = false;`
    )
    const dataToSync = dataToSyncQuery?.rows.map(({ _synced, updated_at, ...rest }) => rest) || []
    let res: QueryResponse<Tables<TablesName>> | null = null

    if (tableName !== 'products_qty') {
      res = await pushTableData(tableName, dataToSync)
    }

    if (tableName === 'stock_movements' && res?.data) {
      await syncProductsQty(res.data?.map((s) => s.id))
    }

    const result = await db?.query<MaxDateResult>(
      `SELECT TO_CHAR(MAX(updated_at), 'YYYY-MM-DD"T"HH24:MI:SS.USOF') AS max_date 
      FROM public.${tableName};`
    )

    const maxDate = result?.rows?.[0]?.max_date || '1970-01-01T00:00:00.000000+00:00'
    // Adding explicit microseconds format
    const { data: pulledData, error } = await pullTableData(tableName, { date: maxDate })
    if (pulledData && !error && db) {
      await upsertDataDB(db, pulledData, tableName)
    } else {
      results[tableName] = { data: null, error }
    }
  }

  return results as Record<TablesName, QueryResponse<Tables<TablesName>>>
}

async function syncProductsQty(stockMovementsIds: string[]) {
  return await supabase.rpc('adjust_product_qte', {
    stock_movement_ids: stockMovementsIds
  })
}

export { TABLES }
export type { TablesName, QueryParams, QueryResponse }
