import api from "./BaseApi"
import type { RatingTag, RatingSubmissionPayload } from "../constants/orderHistoryInterface"
import { AxiosError } from "axios"

export const RatingApi = {
  // GET /tags-service/suggest?category=food_quality&sentiment=positive
  async getRatingTags(category: string, sentiment?: string) {
    const params: Record<string, string> = { category }
    if (sentiment) params.sentiment = sentiment
    const res = await api.get<{ success: boolean; data: RatingTag[] }>("/tags-service/suggest", {
      params,
    })
    return res.data
  },

  // POST /ratings/submit
  async submitRating(payload: RatingSubmissionPayload) {
    try {
      const res = await api.post<{ success: boolean; message: string }>("/ratings-service/save-ratings", payload)
      return res.data
    } catch (error) {
      console.error("RatingsApi.submitRating - error:", error)
      // rethrow so caller can handle and modal doesn't silently close
      throw error
    }
  },

  async getLoyaltyCoins() {
    try {
      const res = await api.get('/loyalty-program/coins/details')
      return res.data
    } catch (error: unknown) {
      if(error instanceof AxiosError) {
        throw error
      }
    }
  }
}