export interface RestaurantInfo {
  name: string
  address?: string
  image?: string
}

export interface OrderItemInfo {
  foodItemId: string
  name: string
  quantity: number
  price: number
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"

export interface ItemRating {
  itemId: string
  rating: number
  review?: string
  tags?: string[]
  _id?: string
}

export interface OrderHistoryItem {
  _id: string
  outletId: string
  userId: string
  items: OrderItemInfo[]
  status: OrderStatus
  subtotal: number
  tax?: number
  deliveryFee?: number
  containerTotal?: number
  containerCharge?: number
  grandTotal: number
  createdAt: string
  updatedAt?: string
  restaurantName?: string
  outletName: string
  outletAddress: string
  fssaiImage: string
  // New rating fields
  rating?: number
  ratingReview?: string
  ratingTags?: string[]
  itemRatings?: ItemRating[]
  deliveryRating?: number
  deliveryRatingReview?: string
  // Outlet info from new API structure
  outletInfo?: OutletInfo;
  loyaltyCoins?: LoyaltyCoins
}

export interface LoyaltyCoins {
  earned: number
  baseCoins: number
  multiplier: number
  awardedAt: string
}

export interface OutletInfo {
  _id: string
  outletName: string
  outletAddress?: {
    _id: string
    formatAddress: string
  }
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface OrderHistoryResponse {
  success: boolean
  data: OrderHistoryItem[]
  pagination?: PaginationInfo
  message?: string
}

export interface ReorderRequest {
  orderId: string
  items: { foodItemId: string; quantity: number }[]
}

export interface ReorderResponse {
  success: boolean
  message?: string
}

export interface NewOrderApiResponse {
  message: string
  data: NewOrderData[]
}

export interface NewOrderData {
  _id: string
  userId: string
  containerTotal: number
  deliveryFee: number
  grandTotal: number
  itemTotal: number
  items: NewOrderItem[]
  outletId: string
  outletInfo: OutletInfo
  restaurantInfo: RestaurantInfo
  status: string
  subtotal: number
  tax: number
  createdAt?: string
  updatedAt?: string
}

export interface NewOrderItem {
  name: string
  price: number
  quantity: number
  itemTotal: number
}

// Rating Modal Interfaces
export interface RatingModalData {
  orderId: string
  outletId: string
  restaurantName: string
  items: OrderItemInfo[]
  currentRating?: number
  currentReview?: string
}

export interface RatingCategory {
  id: string
  label: string
}

export interface RatingTag {
  _id: string
  name?: string
  title?: string
  category: string
}

export interface ItemRatingData {
  itemId: string
  rating: number
  review?: string
}

export interface RatingSubmissionPayload {
  orderId: string
  outletId: string
  outletRating: number
  outletReview?: string
  tags: string[]
  items: ItemRatingData[]
}

export interface RatingTagsResponse {
  success: boolean
  data: RatingTag[]
  message?: string
}

export interface RatingSubmissionResponse {
  success: boolean
  message: string
  data?: unknown
}
