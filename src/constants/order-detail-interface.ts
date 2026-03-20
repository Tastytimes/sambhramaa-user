/**
 * Order detail types aligned with the actual API response structure.
 * The API returns the order object directly, not wrapped in an array.
 */
export type OrderDetailStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "awaiting_payment"
  | "food_ready"

export interface OrderDetailItem {
  _id: string
  foodItemId: string
  name: string
  price: number
  quantity: number
  containerCharge?: number
  itemTotal?: number
  containerTotal?: number
}

export interface OutletInfo {
  _id: string
  outletName: string
  status?: boolean
  restaurantInfo?: RestaurantInfo
  outletAddress?: string | unknown // Allow any type for address objects
}

export interface RestaurantInfo {
  _id: string
  restuarantName: string
  restuarantImage?: string
}

export interface OrderDetail {
  _id: string
  addressId?: string
  items: OrderDetailItem[]

  itemTotal: number
  containerTotal: number
  subtotal: number
  deliveryFee: number
  tax: number
  grandTotal: number

  status: OrderDetailStatus

  outletInfo: OutletInfo
  restaurantInfo?: RestaurantInfo

  userAddress: string | unknown // Allow unknown type for address objects
  userAddressLocationName?: string
  userName?: string
  outletAddress?: string | unknown // Allow unknown type for address objects

  // New delivery partner fields
  deliveryPartnerName?: string
  deliveryPartnerPhone?: string

  orderNo?: string
  createdAt?: string
  updatedAt?: string
}

export interface OrderDetailResponse {
  message?: string
  data?: OrderDetail | OrderDetail[]
}
