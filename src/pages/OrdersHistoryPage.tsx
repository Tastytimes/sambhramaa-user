"use client"

import type React from "react"
import { useEffect, useMemo, useState, useCallback } from "react"
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonToast,
  type RefresherEventDetail,
  type InfiniteScrollCustomEvent,
} from "@ionic/react"
import { useHistory } from "react-router-dom"
import LoadingSpinner from "../components/LoadingSpinner"
import RatingModal from "../components/RatingModal"
import type {
  OrderHistoryItem,
  OrderStatus,
  RatingModalData,
  RatingSubmissionPayload,
} from "../constants/orderHistoryInterface"
import { OrdersApi } from "../api/OrderApi"
import { RatingApi } from "../api/RatingsApi"
import { AxiosError } from "axios"
import "./OrderHistoryPage.css"

type FilterKey = "all" | "ongoing" | "delivered" | "cancelled"
const ONGOING: OrderStatus[] = ["placed", "confirmed", "preparing", "ready", "out_for_delivery"]

export default function OrderHistoryPage() {
  const history = useHistory()

  // Local page state (no Redux thunks)
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filter, setFilter] = useState<FilterKey>("all")

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingModalData, setRatingModalData] = useState<RatingModalData | null>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)
  const isSearching = debouncedQuery.trim().length > 0

  // Initial load
  useEffect(() => {
    loadOrders(1, true).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch a page of orders
  async function loadOrders(targetPage: number, refresh = false) {
    try {
      if (refresh) {
        setOrders([])
        setHasMore(true)
        setError(null)
      }
      setLoading(true)

      const res = await OrdersApi.getAllOrdersHistory(targetPage, 10)
      // Support both shapes: { data: { orders... } } or { orders... }
      const payload = (res?.data as { orders: OrderHistoryItem[]; page: number; totalPages: number }) ?? res?.data
      const data = payload

      if (data && Array.isArray(data.orders)) {
        setOrders((prev) => (refresh || targetPage === 1 ? data.orders : [...prev, ...data.orders]))
        setPage(data.page)
        setHasMore(data.page < data.totalPages)
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.message)
      } else {
        setError("Failed to fetch order history")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    await loadOrders(1, true)
    event.detail.complete()
  }, [])

  const handleLoadMore = useCallback(
    async (event: InfiniteScrollCustomEvent) => {
      if (hasMore && !loading && !isSearching) {
        await loadOrders(page + 1)
      }
      event.target.complete()
    },
    [hasMore, loading, page, isSearching],
  )

  const handleOrderClick = useCallback(
    (orderId: string) => {
      history.push(`/orders-history/details/${orderId}`)
    },
    [history],
  )

  const handleReorder = useCallback((orderId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log("Reorder:", orderId)
    setToastMessage("Reorder functionality will be implemented soon")
    setShowToast(true)
  }, [])

  const handleOpenRatingModal = useCallback((order: OrderHistoryItem, event: React.MouseEvent) => {
    event.stopPropagation()

    // Don't open modal if rating is already submitted
    if (order.rating && order.rating > 0) {
      return
    }

    const restaurantName = order.restaurantName ?? order.outletInfo?.outletName ?? "Restaurant"

    setRatingModalData({
      orderId: order._id,
      outletId: order.outletId ?? order.outletInfo?._id ?? "",
      restaurantName,
      items: order.items,
      currentRating: order.rating,
      currentReview: order.ratingReview,
    })
    setShowRatingModal(true)
  }, [])

  const handleCloseRatingModal = useCallback(() => {
    setShowRatingModal(false)
    setRatingModalData(null)
  }, [])

  const handleSubmitRating = useCallback(async (payload: RatingSubmissionPayload) => {
    console.debug("handleSubmitRating - payload:", payload)
    try {
      const response = await RatingApi.submitRating(payload)
      console.debug("handleSubmitRating - api response:", response)

      const anyRes = response as unknown as Record<string, unknown>
      const isSuccess = !!(response && (anyRes.success === true || anyRes.message || anyRes.data))

      if (isSuccess) {
        // Update local state optimistically with new object references
        setOrders((prev) =>
          prev.map((order) => {
            if (order._id === payload.orderId) {
              // create a new object to ensure React re-renders
              return Object.assign({}, order, {
                rating: payload.outletRating,
                ratingReview: payload.outletReview,
                ratingTags: payload.tags,
              })
            }
            return order
          }),
        )

        console.debug("handleSubmitRating - updated orders state for orderId:", payload.orderId)

        // Close the modal explicitly in the parent to ensure it definitely closes
        setShowRatingModal(false)
        setRatingModalData(null)

        setToastMessage("Rating submitted successfully!")
        setShowToast(true)
      }

      return response
    } catch (error) {
      console.error("Error submitting rating:", error)
      setToastMessage("Failed to submit rating. Please try again.")
      setShowToast(true)
      return undefined
    }
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
    return date.toLocaleDateString("en-US", options)
  }, [])

  const getDeliveryStatusInfo = useCallback((status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return { text: "Delivered", class: "delivered", icon: "✓" }
      case "cancelled":
        return { text: "Cancelled", class: "cancelled", icon: "✕" }
      case "preparing":
        return { text: "Preparing", class: "preparing", icon: "🍳" }
      case "confirmed":
        return { text: "Confirmed", class: "preparing", icon: "✓" }
      case "ready":
        return { text: "Ready", class: "preparing", icon: "🎯" }
      case "out_for_delivery":
        return { text: "Out for delivery", class: "preparing", icon: "🚚" }
      default:
        return { text: "Placed", class: "", icon: "📝" }
    }
  }, [])

  const renderStars = useCallback(
    (currentRating: number, onStarClick: (rating: number, event: React.MouseEvent) => void) => {
      const stars = []
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <span key={i} className={`star ${i <= currentRating ? "" : "empty"}`} onClick={(e) => onStarClick(i, e)}>
            ★
          </span>,
        )
      }
      return stars
    },
    [],
  )

  const renderLoyaltyCoinsSection = useCallback((order: OrderHistoryItem) => {
    if (!order.loyaltyCoins || order.loyaltyCoins.earned <= 0) {
      return null
    }

    return (
      <div className="loyalty-coins-section">
        <div className="loyalty-coins-container">
          <div className="coins-icon">🪙</div>
          <div className="coins-message">
            <span className="coins-text">
              You have earned <strong>{order.loyaltyCoins.earned} Ioshii coins</strong>
            </span>
            {order.loyaltyCoins.multiplier > 1 && (
              <span className="coins-multiplier">
                ({order.loyaltyCoins.baseCoins} × {order.loyaltyCoins.multiplier})
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }, [])

  const renderRatingSection = useCallback(
    (order: OrderHistoryItem) => {
      if (order.status !== "delivered") return null

      const foodRating = order.rating || 0
      const deliveryRating = order.deliveryRating || 0

      const foodRated = foodRating > 0
      const deliveryRated = deliveryRating > 0

      return (
        <>
          <div className="rating-section" onClick={(e) => e.stopPropagation()}>
            <div className="rating-container">
              {/* Food Rating */}
              <div
                className={`rating-category ${foodRated ? "disabled" : ""}`}
                onClick={!foodRated ? (e) => handleOpenRatingModal(order, e) : undefined}
              >
                <h4 className="rating-title">Food Rating</h4>
                <div className="star-rating">
                  {renderStars(foodRating, (rating, e) => {
                    if (!foodRated) {
                      handleOpenRatingModal(order, e)
                    }
                  })}
                </div>
                <p className={`rating-status ${foodRated ? "rated" : ""}`}>
                  {foodRated ? `Rated ${foodRating} stars` : "Tap to rate"}
                </p>
              </div>

              {/* Divider */}
              <div className="rating-divider"></div>

              {/* Delivery Rating */}
              <div
                className={`rating-category ${deliveryRated ? "disabled" : ""}`}
                onClick={!deliveryRated ? (e) => handleOpenRatingModal(order, e) : undefined}
              >
                <h4 className="rating-title">Delivery Rating</h4>
                <div className="star-rating">
                  {renderStars(deliveryRating, (rating, e) => {
                    if (!deliveryRated) {
                      handleOpenRatingModal(order, e)
                    }
                  })}
                </div>
                <p className={`rating-status ${deliveryRated ? "rated" : ""}`}>
                  {deliveryRated ? `Rated ${deliveryRating} stars` : "Tap to rate"}
                </p>
              </div>
            </div>
          </div>

          <div className="reorder-section">
            <button className="reorder-button" onClick={(e) => handleReorder(order._id, e)}>
              Reorder
            </button>
          </div>
        </>
      )
    },
    [renderStars, handleOpenRatingModal, handleReorder],
  )

  // Client-side search over loaded items only
  const searchedOrders = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return orders
    const result = orders.filter((o) => {
      const restaurant = (o.restaurantName ?? o.outletInfo?.outletName ?? "").toLowerCase()
      const outlet = (o.outletName ?? o.outletInfo?.outletName ?? "").toLowerCase()
      const address = (o.outletAddress ?? "").toLowerCase()
      const inItems = o.items.some((it) => it.name.toLowerCase().includes(q))
      return restaurant.includes(q) || outlet.includes(q) || address.includes(q) || inItems
    })
    if (result.length === 0) {
      setToastMessage("No results found")
      setShowToast(true)
    }
    return result
  }, [orders, debouncedQuery])

  // Status filtering on top of search results
  const visibleOrders = useMemo(() => {
    switch (filter) {
      case "delivered":
        return searchedOrders.filter((o) => o.status === "delivered")
      case "cancelled":
        return searchedOrders.filter((o) => o.status === "cancelled")
      case "ongoing":
        return searchedOrders.filter((o) => ONGOING.includes(o.status))
      default:
        return searchedOrders
    }
  }, [searchedOrders, filter])

  const isLoadingInitial = useMemo(() => loading && orders.length === 0, [loading, orders.length])

  const emptyMessage =
    orders.length === 0
      ? "When you place your first order, it will appear here."
      : "Try a different filter or search term."

  return (
    <IonPage className="order-history-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Your Orders</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by restaurant or dish"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button className="search-clear" aria-label="Clear search" onClick={() => setSearchQuery("")}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* Filters */}
        <div className="status-filter" role="tablist" aria-label="Order status filters">
          {(["all", "ongoing", "delivered", "cancelled"] as FilterKey[]).map((key) => (
            <button
              key={key}
              className={`status-chip ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              role="tab"
            >
              {key === "all" ? "All" : key === "ongoing" ? "Ongoing" : key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="orders-container">
          {isLoadingInitial ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="error-container">
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={() => loadOrders(1, true)}>
                Try Again
              </button>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <h3>No orders found</h3>
              <p>{emptyMessage}</p>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const statusInfo = getDeliveryStatusInfo(order.status)
              return (
                <div
                  key={order._id}
                  className={`order-card ${order.status}`}
                  onClick={handleOrderClick.bind(null, order._id)}
                >
                  {/* Restaurant Header */}
                  <div className="restaurant-header">
                    <div className="restaurant-main-info">
                      <img
                        src={
                          order.fssaiImage
                            ? order.fssaiImage
                            : "/placeholder.svg?height=60&width=60&query=restaurant%20logo"
                        }
                        alt={(order.restaurantName ?? order.outletInfo?.outletName ?? "Restaurant") as string}
                        className="restaurant-image"
                      />
                      <div className="restaurant-text-info">
                        <h3 className="restaurant-name">
                          {order.restaurantName ?? order.outletInfo?.outletName ?? "Restaurant"}
                        </h3>
                        <p className="restaurant-location">
                          {order.outletAddress ?? order.outletInfo?.outletName ?? "Location"}
                        </p>
                      </div>
                    </div>
                    <div className={`delivery-status-badge ${statusInfo.class}`}>
                      <span className="status-check">{statusInfo.icon}</span>
                      {statusInfo.text}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="order-items-section">
                    {order.items.map((item, index) => (
                      <div key={item.foodItemId || index} className="order-item">
                        <span className="item-quantity">{item.quantity} x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Loyalty Coins Section */}
                  {renderLoyaltyCoinsSection(order)}

                  {/* Rating Section - Only for delivered orders */}
                  {renderRatingSection(order)}

                  {/* Order Footer */}
                  <div className="order-footer">
                    <p className="order-date">Ordered: {formatDate(order.updatedAt || "")}</p>
                    <p className="order-total">Bill Total: ₹{order.grandTotal}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Infinite Scroll */}
        <IonInfiniteScroll
          onIonInfinite={handleLoadMore}
          threshold="100px"
          disabled={!hasMore || loading || isSearching}
        >
          <IonInfiniteScrollContent loadingText="Loading more orders..." />
        </IonInfiniteScroll>

        {/* Toast Messages */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2200}
          position="bottom"
          color={toastMessage.includes("No results") ? "medium" : "dark"}
        />
      </IonContent>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={handleCloseRatingModal}
        ratingData={ratingModalData}
        onSubmitRating={handleSubmitRating}
      />
    </IonPage>
  )
}

/* Simple debounce hook without extra libs */
function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handle)
  }, [value, delay])
  return debounced
}
