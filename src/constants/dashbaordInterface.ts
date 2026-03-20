export interface Banner {
  id: string
  imageUrl: string
  displayOrder: number
}

export interface Cuisine {
  id: string
  name: string
  image: string
}

export interface RestaurantCuisine {
  name: string
}

export interface RestaurantInfo {
  _id: string
  restuarantName: string
  cuisine: RestaurantCuisine[]
  fssaiImage: string
}

export interface Restaurant {
  _id: string
  outletName: string
  restId: RestaurantInfo
  status: boolean
  isSameBankDetails: boolean
  isSameGstDetails: boolean
  isSameOutletTimings: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  __v: number
  favoritesCount: number
  distance: number | null
}

export interface Pagination {
  totalOutlets: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface LoyaltyAccountBalance {
  currentBalance: number
  lastUpdated: Date;
  tier: string;
  totalCoinsEarned: number;
}

export interface DashboardData {
  banners: Banner[]
  popularCuisines: Cuisine[]
  outlets: Restaurant[]
  pagination: Pagination
  loyalty: LoyaltyAccountBalance | null
}

export interface DashboardApiResponse {
  success: boolean
  message: string
  data: DashboardData
}

export interface DashboardRequestPayload {
  latitude: number
  longitude: number
  page: number
  limit: number
  cuisines?: string
  includeStaticData: boolean
}

export interface FilterOptions {
  sortBy: string
  cuisines: string[]
  vegetarian: boolean
  priceRange: [number, number]
  rating: number
}

export interface CurrentLocation {
  latitude: number
  longitude: number
  address: string
  area?: string
  city?: string
}
