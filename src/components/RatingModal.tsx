"use client"

import { useState, useEffect, useCallback } from "react"
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonTextarea,
  IonItem,
  IonLabel,
  IonChip,
  IonToast,
  IonAccordion,
  IonAccordionGroup,
  IonSpinner,
} from "@ionic/react"
import { close, chevronDown } from "ionicons/icons"
import type {
  RatingModalData,
  RatingCategory,
  RatingTag,
  ItemRatingData,
  RatingSubmissionPayload,
  RatingSubmissionResponse,
} from "../constants/orderHistoryInterface"
import { RatingApi } from "../api/RatingsApi"
import './RatingModal.css'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  ratingData: RatingModalData | null
  onSubmitRating: (payload: RatingSubmissionPayload) => Promise<RatingSubmissionResponse | undefined>
}

const RATING_CATEGORIES: RatingCategory[] = [
  { id: "food_quality", label: "Food Quality" },
  { id: "delivery_experience", label: "Delivery Experience" },
  { id: "packaging", label: "Packaging" },
  { id: "service", label: "Service" },
  { id: "pricing", label: "Pricing" },
  { id: "Overall_Experience", label: "Overall Experience" },
]

export default function RatingModal({ isOpen, onClose, ratingData, onSubmitRating }: RatingModalProps) {
  useEffect(() => {
    // debug logs removed
  }, [isOpen])

  const [outletRating, setOutletRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<RatingTag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [outletReview, setOutletReview] = useState("")
  const [itemRatings, setItemRatings] = useState<ItemRatingData[]>([])
  const [itemReviews, setItemReviews] = useState<{ [key: string]: string }>({})
  const [loadingTags, setLoadingTags] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && ratingData) {
      setOutletRating(ratingData.currentRating || 0)
      setOutletReview(ratingData.currentReview || "")
      setSelectedCategories([])
      setAvailableTags([])
      setSelectedTags([])
      setItemRatings([])
      setItemReviews({})
      setHoveredRating(0)
      setSubmitting(false)
    }
  }, [isOpen, ratingData])

  const handleClose = useCallback(() => {
    // debug logs removed
    setOutletRating(0)
    setHoveredRating(0)
    setSelectedCategories([])
    setAvailableTags([])
    setSelectedTags([])
    setOutletReview("")
    setItemRatings([])
    setItemReviews({})
    setSubmitting(false)
    onClose()
  }, [onClose])

  const handleStarClick = useCallback((rating: number) => {
    setOutletRating(rating)
    setHoveredRating(0)
  }, [])

  const handleCategoryClick = useCallback(
    async (categoryId: string) => {
      // Ensure category appears selected (do not toggle off on re-click)
      setSelectedCategories((prev) => (prev.includes(categoryId) ? prev : [...prev, categoryId]))

      // Determine sentiment from outletRating: 1-2 => negative, 3 => neutral, 4-5 => positive
      let sentiment: string | undefined
      if (outletRating > 0) {
        if (outletRating <= 2) sentiment = "negative"
        else if (outletRating === 3) sentiment = "neutral"
        else sentiment = "positive"
      }

      // Fetch tags for this category (include sentiment when available)
      try {
        setLoadingTags(true)
        const response = await RatingApi.getRatingTags(categoryId, sentiment)

        setAvailableTags((prev) => {
          const existingIds = prev.map((tag) => tag._id)
          const newTags = response.data.filter((tag) => !existingIds.includes(tag._id))
          return [...prev, ...newTags]
        })
      } catch (error) {
        console.error("Error fetching tags:", error)
        setToastMessage("Failed to load tags")
        setShowToast(true)
      } finally {
        setLoadingTags(false)
      }
    },
    [outletRating],
  )

  const handleTagClick = useCallback((tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }, [])

  const handleItemRating = useCallback((itemId: string, rating: number) => {
    setItemRatings((prev) => {
      const existing = prev.find((item) => item.itemId === itemId)
      if (existing) {
        return prev.map((item) => (item.itemId === itemId ? { ...item, rating } : item))
      } else {
        return [...prev, { itemId, rating }]
      }
    })
  }, [])

  const handleItemReview = useCallback((itemId: string, review: string) => {
    setItemReviews((prev) => ({ ...prev, [itemId]: review }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!ratingData || outletRating === 0) {
      setToastMessage("Please provide an overall rating")
      setShowToast(true)
      return
    }

    setSubmitting(true)

    try {
      const payload: RatingSubmissionPayload = {
        orderId: ratingData.orderId,
        // Ensure we always include an outletId field (fallback to empty string for debugging)
        outletId: ratingData.outletId ?? "",
        outletRating,
        outletReview: outletReview.trim() || undefined,
        tags: selectedTags,
        // Include every ordered item with itemId (try multiple id fields) and any provided rating/review
        items: ratingData.items
          .map((orderedItem) => {
            const obj = orderedItem as unknown as Record<string, unknown>
            const originalId =
              typeof obj.foodItemId === "string"
                ? (obj.foodItemId as string)
                : typeof obj.itemId === "string"
                ? (obj.itemId as string)
                : typeof obj._id === "string"
                ? (obj._id as string)
                : ""

            const rated = itemRatings.find((r) => r.itemId === originalId)
            return {
              itemId: originalId,
              rating: rated?.rating || 0,
              review: rated ? itemReviews[originalId]?.trim() || undefined : undefined,
            }
          })
          .filter((it) => it.itemId),
      }

      const response = await onSubmitRating(payload)

      const anyRes = response as unknown as Record<string, unknown>
      const isSuccess = !!(response && (anyRes.success === true || anyRes.message || anyRes.data))

      if (isSuccess) {
        setToastMessage("Rating submitted successfully!")
        setShowToast(true)

        // Close modal immediately to reflect updates in parent
        // add a tiny delay to allow parent update to propagate visually
        setTimeout(() => handleClose(), 200)
      } else {
        // Keep modal open; show error
        setToastMessage((anyRes && (anyRes.message as string)) || "Failed to submit rating")
        setShowToast(true)
        // Do not close the modal so user can retry
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      setToastMessage("Failed to submit rating")
      setShowToast(true)
    } finally {
      setSubmitting(false)
    }
  }, [ratingData, outletRating, outletReview, selectedTags, itemRatings, itemReviews, onSubmitRating, handleClose])

  const renderStars = useCallback(
    (rating: number, onStarClick?: (rating: number) => void, size = "large") => {
      const stars = []
      const displayRating = hoveredRating || rating

      for (let i = 1; i <= 5; i++) {
        stars.push(
          <span
            key={i}
            className={`rating-star ${size} ${i <= displayRating ? "filled" : "empty"}`}
            onClick={onStarClick ? () => onStarClick(i) : undefined}
            onMouseEnter={onStarClick ? () => setHoveredRating(i) : undefined}
            onMouseLeave={onStarClick ? () => setHoveredRating(0) : undefined}
          >
            ★
          </span>,
        )
      }
      return stars
    },
    [hoveredRating],
  )

  const renderItemStars = useCallback(
    (itemId: string, currentRating: number) => {
      const stars = []
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <span
            key={i}
            className={`rating-star small ${i <= currentRating ? "filled" : "empty"}`}
            onClick={() => handleItemRating(itemId, i)}
          >
            ★
          </span>,
        )
      }
      return stars
    },
    [handleItemRating],
  )

  if (!ratingData) return null

  const filteredTags = availableTags.filter((tag) => selectedCategories.includes(tag.category))

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={() => {
        // onDidDismiss handler - kept to reset state when modal dismissed
        handleClose()
      }} className="rating-modal">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={handleClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>Meal from {ratingData.restaurantName}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="rating-modal-content">
          <div className="rating-modal-body">
            {/* Overall Rating */}
            <div className="overall-rating-section">
              <div className="star-rating-container">{renderStars(outletRating, handleStarClick)}</div>
            </div>

            {/* Category Chips */}
            {outletRating > 0 && (
              <div className="category-section">
                <div className="category-chips">
                  {RATING_CATEGORIES.map((category) => (
                    <IonChip
                      key={category.id}
                      className={`category-chip ${selectedCategories.includes(category.id) ? "selected" : ""}`}
                      onClick={() => handleCategoryClick(category.id)}
                      disabled={loadingTags}
                    >
                      <IonLabel>{category.label}</IonLabel>
                    </IonChip>
                  ))}
                </div>
                {loadingTags && (
                  <div className="loading-tags">
                    <IonSpinner name="crescent" />
                    <span>Loading tags...</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {filteredTags.length > 0 && (
              <div className="tags-section">
                <div className="tags-container">
                  {filteredTags.map((tag) => (
                    <IonChip
                      key={tag._id}
                      className={`tag-chip ${selectedTags.includes(tag._id) ? "selected" : ""}`}
                      onClick={() => handleTagClick(tag._id)}
                    >
                      <IonLabel>{tag.title ?? tag.name ?? ""}</IonLabel>
                    </IonChip>
                  ))}
                </div>
              </div>
            )}

            {/* Accordion Sections */}
            <IonAccordionGroup className="accordion-group">
              {/* Rate Ordered Dishes */}
              <IonAccordion value="dishes">
                <IonItem slot="header" className="accordion-header">
                  <IonLabel>Rate your ordered dishes</IonLabel>
                  <IonIcon icon={chevronDown} slot="end" />
                </IonItem>
                <div className="accordion-content" slot="content">
                  {ratingData.items.map((item, index) => {
                    // Derive a stable id for the ordered item (handles different shapes)
                    const itemRec = item as unknown as Record<string, unknown>
                    const itemId = typeof itemRec.foodItemId === "string"
                      ? (itemRec.foodItemId as string)
                      : typeof itemRec.itemId === "string"
                      ? (itemRec.itemId as string)
                      : typeof itemRec._id === "string"
                      ? (itemRec._id as string)
                      : String(index)

                    const currentRating = itemRatings.find((r) => r.itemId === itemId)?.rating || 0
                    return (
                      <div key={itemId} className="dish-item">
                        <div className="dish-header">
                          <span className="dish-name">{item.name}</span>
                          <div className="dish-rating">
                            <div className="item-stars">{renderItemStars(itemId, currentRating)}</div>
                          </div>
                        </div>
                        {currentRating > 0 && (
                          <IonTextarea
                            placeholder="Add a review for this item (optional)"
                            value={itemReviews[itemId] || ""}
                            onIonInput={(e) => handleItemReview(itemId, e.detail.value!)}
                            className="item-review-input"
                            rows={2}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </IonAccordion>

              {/* Detailed Review */}
              <IonAccordion value="review">
                <IonItem slot="header" className="accordion-header">
                  <IonLabel>Add a detailed review</IonLabel>
                  <IonIcon icon={chevronDown} slot="end" />
                </IonItem>
                <div className="accordion-content" slot="content">
                  <IonTextarea
                    placeholder="Share your experience..."
                    value={outletReview}
                    onIonInput={(e) => setOutletReview(e.detail.value!)}
                    rows={4}
                    maxlength={500}
                    className="review-textarea"
                  />
                  <div className="character-count">{outletReview.length}/500</div>
                </div>
              </IonAccordion>

              {/* Delivery Partner Rating */}
              <IonAccordion value="delivery">
                <IonItem slot="header" className="accordion-header">
                  <IonLabel>Rate your delivery partner</IonLabel>
                  <IonIcon icon={chevronDown} slot="end" />
                </IonItem>
                <div className="accordion-content" slot="content">
                  <div className="delivery-rating">
                    <p>How was your delivery experience?</p>
                    <div className="delivery-stars">{renderStars(0, undefined, "medium")}</div>
                  </div>
                </div>
              </IonAccordion>
            </IonAccordionGroup>

            {/* Submit Button */}
            <div className="submit-section">
              <IonButton
                expand="block"
                onClick={handleSubmit}
                disabled={outletRating === 0 || submitting}
                className="submit-button"
              >
                {submitting ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span style={{ marginLeft: "8px" }}>Submitting...</span>
                  </>
                ) : (
                  "Submit"
                )}
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />

      
    </>
  )
}
