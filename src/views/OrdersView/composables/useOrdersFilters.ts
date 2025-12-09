import { computed, reactive } from 'vue'
import type { Filters } from '../models/models'

export function useOrdersFilters() {
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const filters = reactive<Filters>({
    docType: null,
    dateRange: [thirtyDaysAgo, today],
    status: null
  })

  const startDate = computed(() => {
    const date = new Date(filters.dateRange[0])
    if (isNaN(date.getTime())) {
      return null
    }
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  })

  const endDate = computed(() => {
    const date = new Date(filters.dateRange[filters.dateRange.length - 1])
    if (isNaN(date.getTime())) {
      return null
    }
    date.setHours(23, 59, 59, 999)
    return date.toISOString()
  })

  return { filters, startDate, endDate }
}
