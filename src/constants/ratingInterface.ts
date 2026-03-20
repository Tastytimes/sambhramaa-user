export interface RatingTag {
  _id: string
  key: string
  title: string
  description: string
  category: string
  sentiment: "positive" | "negative" | "neutral"
  polarityScore: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  __v: number
}

export interface RatingTagsResponse {
  message: string
  data: RatingTag[]
}

export interface RatingCategory {
  id: string
  label: string
}

export interface ItemRatingData {
  itemId: string
  rating: number
  sentiment: "positive" | "negative" | "neutral"
  review?: string
}

export interface RatingSubmissionPayload {
  orderId: string
  outletId: string
  outletRating: number
  sentiment: "positive" | "negative" | "neutral"
  outletReview?: string
  tags: string[]
  items: ItemRatingData[]
}

export interface RatingSubmissionResponse {
  success: boolean
  message: string
  data?: unknown
}

// Helper function to determine sentiment based on rating
export const getSentimentFromRating = (rating: number): "positive" | "negative" | "neutral" => {
  if (rating >= 4) return "positive"
  if (rating <= 2) return "negative"
  return "neutral"
}

// Rating categories for the modal
export const RATING_CATEGORIES: RatingCategory[] = [
  { id: "food_quality", label: "Food Quality" },
  { id: "delivery_experience", label: "Delivery Experience" },
  { id: "packaging", label: "Packaging" },
  { id: "value_for_money", label: "Value for Money" },
  { id: "customer_service", label: "Customer Service" },
  { id: "overall_experience", label: "Overall Experience" },
]
