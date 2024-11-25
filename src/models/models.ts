export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  organization_id: string | null
}

export interface Order {
  id: string
  index: number
  doc_index: number | null
  org_id: string
  individual_id: string | null
  client_id: string | null
  date: Date | string
  order_lines: OrderLine[]
  delivery: Delivery
  document_type: DocumentType
  status: OrderStatus
  payment_method?: string
  paid_price: number
  total_price: number
  tva?: number
  ttc?: number
}

export interface Payment {
  id: string
  date: Date | string
  amount: number
}

export interface OrderLine {
  id: string
  order_id: string
  product_id: string
  qte: number
  unit_price: number
  unit_cost_price: number | null
  total_price: number
}

export interface Individual {
  id: string
  name: string
  phone: string | null
  org_id: string
}

export interface Delivery {
  id: string
  driver_name: string
  phone: string | undefined
  license_plate: string //xxxxx xxx xx
  destination: string
}

export interface Organization {
  id: string
  name: string
  phone: string
  rc?: string
  nif?: number
  nis?: number
  art?: number
  address?: string
  activity?: string
  org_id?: string | null
}

export interface Product {
  id: string
  code: string
  name: string
  price: number
  cost_price: number | null
  qte: number
  org_id: string
  bar_code: number | null
}

export interface StockMovement {
  id: string
  product_id: string
  qte_change: number
  date: Date
  order_id?: string // To track the order related to the stock reduction
}

export enum StockMovementType {
  Sub = 1,
  Add
}

export enum DocumentType {
  Invoice = 1,
  DeliveryNote,
  Voucher,
  Proforma
}

export enum OrderStatus {
  Pending = 0,
  Confirmed,
  Cancelled
}

export enum ConsumerType {
  Organization = 1,
  Individual
}
