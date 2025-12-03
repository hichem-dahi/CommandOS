import type { DocumentType, OrderStatus } from '@/models/models'

export interface Filters {
  docType: DocumentType | null
  dateRange: Date[] | string[]
  status: OrderStatus | null
}
