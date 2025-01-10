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
