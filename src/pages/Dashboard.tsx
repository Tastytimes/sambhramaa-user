"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  IonContent,
  IonPage,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonText,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonSpinner,
  IonBadge,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonCheckbox,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonToast,
} from "@ionic/react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/autoplay"
import "swiper/css/pagination"
import { Route, Redirect, useHistory } from "react-router-dom"
import {
  homeOutline,
  personOutline,
  cartOutline,
  searchOutline,
  starOutline,
  locationOutline,
  chevronDownOutline,
  // notificationsOutline,
  optionsOutline,
  heartOutline,
  ellipsisVerticalOutline,
  closeOutline,
  checkmarkOutline,
  gridOutline,
  flashOutline,
  diamondOutline,
} from "ionicons/icons"
import { useAppSelector } from "../hooks/useAppSelector"
import { useAppDispatch } from "../hooks/useAppDispatch"
import { COLORS } from "../theme/theme"
import AccountPage from "./AccountPage"
import FavoritesPage from "./FavoritesPage"
import CartPage from "./CartPage"
import type { FilterOptions, Restaurant } from "../constants/dashbaordInterface"
import { checkLocationMatch, fetchSavedAddresses, getCurrentLocation } from "../store/slices/locationSlice"
import { fetchDashboardData, loadMoreRestaurants, resetDashboard, setRefreshing } from "../store/slices/dashboardSlice"
import { fetchCart } from "../store/slices/cartSlice"
import { setUser } from "../store/slices/authSlice"
import { getItem } from "../utills/storage"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

const HomePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth)
  const { currentLocation, selectedAddress } = useAppSelector((state) => state.location)
  const {
    data: dashboardData,
    restaurants,
    loading,
    loadingMore,
    refreshing,
    hasMorePages,
    staticDataLoaded,
    initialFetchDone,
  } = useAppSelector((state) => state.dashboard)

  const dispatch = useAppDispatch()
  const history = useHistory()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "relevance",
    cuisines: [],
    vegetarian: false,
    priceRange: [0, 1000],
    rating: 0,
  })
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  // Track if initial location fetch is in progress
  const [isInitializing, setIsInitializing] = useState(false)
  const hasInitializedRef = useRef(false)

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await getItem("userData")
        if (storedUserData && !user) {
          const userData = JSON.parse(storedUserData)
          dispatch(setUser(userData))
        }
      } catch (error) {
        console.error("Failed to load user data from storage:", error)
      }
    }
    loadUserData()
  }, [dispatch, user])

  // Initialize location and data on component mount
  useEffect(() => {
    // Skip if already initialized or if we already have data
    if (hasInitializedRef.current) return
    if (initialFetchDone && restaurants.length > 0 && (currentLocation || selectedAddress)) return

    hasInitializedRef.current = true

    const init = async () => {
      setIsInitializing(true)
      try {
        await initializeApp()
        dispatch(fetchCart())
      } finally {
        setIsInitializing(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch dashboard data when location is available and initialization is complete
  useEffect(() => {
    // Skip if we're still initializing or already loading
    if (isInitializing || loading) return

    // Skip if no location is available
    if (!currentLocation && !selectedAddress) return

    // Skip if initial fetch is already done (prevents duplicate calls)
    if (initialFetchDone && restaurants.length > 0) return

    // Skip if we haven't initialized yet
    if (!hasInitializedRef.current) return

    // Fetch dashboard with static data only if not already loaded
    fetchDashboard(1, !staticDataLoaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, selectedAddress, isInitializing])

  // Track previous cuisine to detect actual changes
  const prevCuisineRef = useRef(selectedCuisine)

  // Refetch when cuisine selection changes
  useEffect(() => {
    // Skip on initial render or when initializing
    if (isInitializing || !initialFetchDone) return

    // Skip if no location
    if (!currentLocation && !selectedAddress) return

    // Skip if cuisine hasn't actually changed
    if (prevCuisineRef.current === selectedCuisine) return

    prevCuisineRef.current = selectedCuisine

    // Fetch with the new cuisine filter
    dispatch(resetDashboard())
    fetchDashboard(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCuisine])

  const initializeApp = async () => {
    try {
      // First, fetch saved addresses
      await dispatch(fetchSavedAddresses()).unwrap()

      // Then get current location
      const location = await dispatch(getCurrentLocation()).unwrap()

      // Check if current location matches any saved address
      await dispatch(checkLocationMatch(location))
    } catch (error: unknown) {
      console.error("Failed to initialize app:", error)
      showToast("Failed to get your location. Please enable location services.", "danger")
    }
  }

  const fetchDashboard = useCallback(
    async (page = 1, includeStatic = false) => {
      const location = selectedAddress || currentLocation
      if (!location) return

      try {
        const payload = {
          latitude: selectedAddress ? selectedAddress.location.coordinates[1] : currentLocation!.latitude,
          longitude: selectedAddress ? selectedAddress.location.coordinates[0] : currentLocation!.longitude,
          page,
          limit: 10,
          cuisines: selectedCuisine === "" ? "all" : selectedCuisine,
          includeStaticData: includeStatic && !staticDataLoaded,
        }

        if (page === 1) {
          await dispatch(fetchDashboardData(payload)).unwrap()
        } else {
          await dispatch(loadMoreRestaurants(payload)).unwrap()
        }
      } catch (error: unknown) {
        console.error("Failed to fetch dashboard data:", error)
        showToast("Failed to load restaurants. Please try again.", "danger")
      }
    },
    [currentLocation, selectedAddress, selectedCuisine, staticDataLoaded, dispatch],
  )

  const showToast = (message: string, color: ToastState["color"] = "primary"): void => {
    setToast({
      isOpen: true,
      message,
      color,
    })
  }

  const hideToast = (): void => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }

  const handleAddressPress = () => {
    history.push("/select-address")
  }

  const getAddressText = () => {
    if (selectedAddress) {
      return selectedAddress.locationName
    }
    if (currentLocation) {
      return currentLocation.address.length > 30
        ? currentLocation.address.substring(0, 30) + "..."
        : currentLocation.address
    }
    return "Select location"
  }

  const onRefresh = async (event: CustomEvent) => {
    dispatch(setRefreshing(true))
    dispatch(resetDashboard())

    try {
      // Refresh location
      await dispatch(getCurrentLocation()).unwrap()
      // Fetch fresh data
      await fetchDashboard(1, true)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(error.message, "danger")
      } else {
        showToast("Failed to refresh data", "danger")
      }
    } finally {
      event.detail.complete()
      dispatch(setRefreshing(false))
    }
  }

  const loadMore = async (event: CustomEvent) => {
    if (hasMorePages && !loadingMore && (currentLocation || selectedAddress)) {
      try {
        const nextPage = Math.floor(restaurants.length / 10) + 1
        await fetchDashboard(nextPage, false) // Don't need static data for pagination
      } catch (error: unknown) {
        if (error instanceof Error) {
          showToast(error.message, "danger")
        } else {
          showToast("Failed to load more restaurants", "danger")
        }
      }
    }
    event.detail.complete()
  }

  const toggleFilterModal = () => {
    setFilterModalVisible(!filterModalVisible)
  }

  const applyFilters = () => {
    console.log("Applying filters:", filters)
    dispatch(resetDashboard())
    fetchDashboard(1, false) // Don't need static data when applying filters
    toggleFilterModal()
  }

  const resetFilters = () => {
    setFilters({
      sortBy: "relevance",
      cuisines: [],
      vegetarian: false,
      priceRange: [0, 1000],
      rating: 0,
    })
  }

  const handleCuisineSelect = (cuisine: string) => {
    if (cuisine === selectedCuisine) return // Prevent unnecessary re-fetch
    setSelectedCuisine(cuisine)
    // The useEffect watching selectedCuisine will handle the fetch
  }

  const handleRestaurantClick = (restaurant: Restaurant) => {
    // Navigate to restaurant details with outletId and distance as URL parameters
    const params = new URLSearchParams({
      distance: restaurant.distance ? String(restaurant.distance) : "0",
    })
    history.push(`/restaurant-details/${restaurant._id}?${params.toString()}`)
  }

  if (loading && !refreshing) {
    return (
      <IonContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: "40px",
          }}
        >
          <IonSpinner name="crescent" color="primary" />
          <IonText style={{ marginTop: "16px", color: COLORS.text }}>Loading your location...</IonText>
        </div>
      </IonContent>
    )
  }

  return (
    <IonContent>
      <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      <div style={{ paddingBottom: "24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "20px 16px",
            backgroundColor: COLORS.white,
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Location selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                cursor: "pointer",
              }}
              onClick={handleAddressPress}
            >
              <IonIcon
                icon={locationOutline}
                style={{
                  fontSize: "16px",
                  color: COLORS.primary,
                  marginRight: "4px",
                }}
              />
              <IonText
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: COLORS.primary,
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getAddressText()}
              </IonText>
              <IonIcon
                icon={chevronDownOutline}
                style={{
                  fontSize: "14px",
                  color: COLORS.primary,
                  marginLeft: "4px",
                }}
              />
            </div>
            <IonText>
              <h2
                style={{
                  color: COLORS.text,
                  margin: "0 0 4px 0",
                  fontWeight: "bold",
                  fontSize: "24px",
                }}
              >
                Hello, {user?.name || "User"}! 👋
              </h2>
            </IonText>
            <IonText>
              <p
                style={{
                  color: COLORS.gray,
                  margin: 0,
                  fontSize: "16px",
                }}
              >
                What would you like to eat today?
              </p>
            </IonText>
          </div>
          <div
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              borderRadius: "20px",
              backgroundColor: COLORS.lightGray,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <IonIcon icon={diamondOutline} style={{ fontSize: "24px", color: COLORS.text }} onClick={
              () => history.push("/coins")
            }/>
            <IonBadge
              color="primary"
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                fontSize: "10px",
              }}
            >
              {dashboardData?.loyalty?.currentBalance ?? 0}
            </IonBadge>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "0 16px",
            marginBottom: "20px",
          }}
        >
          <IonItem
            style={{
              flex: 1,
              "--border-radius": "12px",
              "--border-width": "1px",
              "--border-style": "solid",
              "--border-color": "#e0e0e0",
              "--background": COLORS.white,
            }}
          >
            <IonIcon icon={searchOutline} slot="start" color="medium" />
            <IonInput
              placeholder="Search for food, restaurants..."
              value={searchQuery}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
            />
          </IonItem>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "8px",
              backgroundColor: COLORS.primary,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={toggleFilterModal}
          >
            <IonIcon icon={optionsOutline} style={{ fontSize: "20px", color: COLORS.white }} />
          </div>
        </div>

        {/* Banner Carousel */}
        {dashboardData?.banners && dashboardData.banners.length > 0 && (
          <div style={{ padding: "0 16px", marginBottom: "16px" }}>
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={10}
              slidesPerView={1}
              autoplay={{ delay: 3000 }}
              pagination={{ clickable: true }}
              style={{ height: "150px", borderRadius: "12px" }}
            >
              {dashboardData.banners.map((banner) => (
                <SwiperSlide key={banner.id}>
                  <img
                    src={banner.imageUrl || "/placeholder.svg?height=150&width=400"}
                    alt="Banner"
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Cuisines */}
        {dashboardData?.popularCuisines && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "16px",
                padding: "0 16px",
                paddingBottom: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "60px",
                  cursor: "pointer",
                }}
                onClick={() => handleCuisineSelect("all")}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "30px",
                    backgroundColor: selectedCuisine === "all" ? COLORS.primary : COLORS.lightGray,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <IonIcon
                    icon={gridOutline}
                    style={{
                      fontSize: "20px",
                      color: selectedCuisine === "all" ? COLORS.white : COLORS.primary,
                    }}
                  />
                </div>
                <IonText
                  style={{
                    fontSize: "12px",
                    color: selectedCuisine === "all" ? COLORS.primary : COLORS.gray,
                    fontWeight: selectedCuisine === "all" ? "500" : "400",
                    textAlign: "center",
                  }}
                >
                  All
                </IonText>
              </div>
              {dashboardData.popularCuisines.map((cuisine) => (
                <div
                  key={cuisine.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: "60px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleCuisineSelect(cuisine.name.toLowerCase())}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "30px",
                      backgroundColor:
                        selectedCuisine === cuisine.name.toLowerCase() ? COLORS.primary : COLORS.lightGray,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={cuisine.image || "/placeholder.svg?height=60&width=60"}
                      alt={cuisine.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <IonText
                    style={{
                      fontSize: "12px",
                      color: selectedCuisine === cuisine.name.toLowerCase() ? COLORS.primary : COLORS.gray,
                      fontWeight: selectedCuisine === cuisine.name.toLowerCase() ? "500" : "400",
                      textAlign: "center",
                    }}
                  >
                    {cuisine.name}
                  </IonText>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Options */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "8px",
            padding: "0 16px",
            marginBottom: "16px",
          }}
        >
          <IonChip onClick={toggleFilterModal}>
            <IonIcon icon={optionsOutline} />
            <IonLabel>Filter</IonLabel>
          </IonChip>
          <IonChip>
            <IonLabel>Nearest</IonLabel>
            <IonIcon icon={chevronDownOutline} />
          </IonChip>
          <IonChip>
            <IonIcon icon={flashOutline} color="primary" />
            <IonLabel>Fast Delivery</IonLabel>
          </IonChip>
          <IonChip>
            <IonLabel>Ratings 4.0+</IonLabel>
          </IonChip>
          <IonChip>
            <IonLabel>Pure Veg</IonLabel>
          </IonChip>
        </div>

        {/* Restaurants Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px",
            marginBottom: "16px",
          }}
        >
          <IonText>
            <h3
              style={{
                color: COLORS.text,
                margin: "0",
                fontWeight: "600",
                fontSize: "18px",
              }}
            >
              Restaurants Near You
            </h3>
          </IonText>
          {dashboardData?.pagination && (
            <IonText
              style={{
                color: COLORS.gray,
                fontSize: "14px",
              }}
            >
              {dashboardData.pagination.totalOutlets} results
            </IonText>
          )}
        </div>

        {/* Restaurants List */}
        <div style={{ padding: "0 16px" }}>
          {restaurants.map((restaurant: Restaurant) => (
            <IonCard
              key={restaurant._id}
              style={{ margin: "0 0 16px 0", position: "relative", cursor: "pointer" }}
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={restaurant.restId?.fssaiImage || "/placeholder.svg?height=200&width=400"}
                  alt={restaurant.restId?.restuarantName || "No Name"}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                  }}
                />
                {/* Card Actions */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "18px",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle favorite toggle
                    }}
                  >
                    <IonIcon icon={heartOutline} style={{ fontSize: "20px", color: "white" }} />
                  </div>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "18px",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle menu options
                    }}
                  >
                    <IonIcon icon={ellipsisVerticalOutline} style={{ fontSize: "20px", color: "white" }} />
                  </div>
                </div>
                {/* Delivery Time Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    backgroundColor: "#9C27B0",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <IonText style={{ color: "white", fontSize: "12px", fontWeight: "600" }}>15-20 MINS</IonText>
                  <IonIcon icon={flashOutline} style={{ fontSize: "14px", color: "white" }} />
                </div>
                {/* Free Delivery Badge */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    backgroundColor: "#9C27B0",
                    borderRadius: "4px",
                    padding: "4px 10px",
                  }}
                >
                  <IonText style={{ color: "white", fontSize: "10px", fontWeight: "500" }}>FREE DELIVERY</IonText>
                </div>
              </div>
              <IonCardContent>
                <IonText>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      color: COLORS.text,
                      fontWeight: "600",
                      fontSize: "18px",
                    }}
                  >
                    {restaurant.restId?.restuarantName || "No restaurant.restId"}
                  </h4>
                </IonText>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <IonIcon
                    icon={locationOutline}
                    style={{
                      fontSize: "14px",
                      color: COLORS.gray,
                      marginRight: "6px",
                    }}
                  />
                  <IonText
                    style={{
                      fontSize: "14px",
                      color: COLORS.gray,
                    }}
                  >
                    {restaurant.outletName} • {restaurant.distance ? `${restaurant.distance}km` : "Distance N/A"}
                  </IonText>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#4CAF50",
                      borderRadius: "4px",
                      padding: "2px 6px",
                    }}
                  >
                    <IonIcon
                      icon={starOutline}
                      style={{
                        fontSize: "14px",
                        color: "white",
                        marginRight: "2px",
                      }}
                    />
                    <IonText
                      style={{
                        fontSize: "12px",
                        color: "white",
                        fontWeight: "500",
                      }}
                    >
                      4.3 (241)
                    </IonText>
                  </div>
                  {restaurant.favoritesCount > 0 && (
                    <IonText
                      style={{
                        fontSize: "12px",
                        color: COLORS.gray,
                        marginLeft: "8px",
                      }}
                    >
                      {restaurant.favoritesCount} favorites
                    </IonText>
                  )}
                </div>
                <IonText
                  style={{
                    fontSize: "14px",
                    color: COLORS.gray,
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  {restaurant.restId?.cuisine.map((c) => c.name).join(", ")} • ₹200 for two
                </IonText>
              </IonCardContent>
            </IonCard>
          ))}

          {/* Infinite Scroll */}
          <IonInfiniteScroll onIonInfinite={loadMore} threshold="100px" disabled={!hasMorePages}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more restaurants..." />
          </IonInfiniteScroll>
        </div>

        {/* Filter Modal */}
        <IonModal isOpen={filterModalVisible} onDidDismiss={toggleFilterModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Filter Options</IonTitle>
              <IonButton fill="clear" slot="end" onClick={toggleFilterModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ maxWidth: "400px", margin: "0 auto" }}>
              {/* Sort By Section */}
              <IonText>
                <h3 style={{ margin: "16px 0 8px 0", color: COLORS.text }}>Sort By</h3>
              </IonText>
              {["Relevance", "Rating: High to Low", "Delivery Time", "Distance"].map((option) => (
                <IonItem key={option} button lines="none">
                  <IonLabel>{option}</IonLabel>
                  {filters.sortBy === option.toLowerCase().replace(/[^a-z]/g, "_") && (
                    <IonIcon icon={checkmarkOutline} slot="end" color="primary" />
                  )}
                </IonItem>
              ))}

              {/* Vegetarian Only */}
              <IonText>
                <h3 style={{ margin: "16px 0 8px 0", color: COLORS.text }}>Dietary</h3>
              </IonText>
              <IonItem>
                <IonCheckbox
                  checked={filters.vegetarian}
                  onIonChange={(e) => setFilters({ ...filters, vegetarian: e.detail.checked })}
                />
                <IonLabel style={{ marginLeft: "8px" }}>Vegetarian Only</IonLabel>
              </IonItem>

              {/* Rating */}
              <IonText>
                <h3 style={{ margin: "16px 0 8px 0", color: COLORS.text }}>Minimum Rating</h3>
              </IonText>
              <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                {[4, 3, 2, 1].map((rating) => (
                  <IonChip
                    key={rating}
                    color={filters.rating === rating ? "primary" : "light"}
                    onClick={() => setFilters({ ...filters, rating })}
                  >
                    <IonLabel>{rating}+</IonLabel>
                  </IonChip>
                ))}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <IonButton fill="outline" expand="block" onClick={resetFilters}>
                  Reset
                </IonButton>
                <IonButton expand="block" onClick={applyFilters}>
                  Apply
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Toast Messages */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={hideToast}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="top"
        />
      </div>
    </IonContent>
  )
}

const Dashboard: React.FC = () => {
  const cartState = useAppSelector((state) => state.cart)
  const cartItemCount = cartState.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <IonPage>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/dashboard" render={() => <Redirect to="/dashboard/home" />} />
          <Route exact path="/dashboard/home" component={HomePage} />
          <Route exact path="/dashboard/cart" component={CartPage} />
          {/* <Route exact path="/dashboard/coins" component={CoinsPage} /> */}
          <Route exact path="/dashboard/account" component={AccountPage} />
          <Route exact path="/dashboard/favorites" component={FavoritesPage} />
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/dashboard/home">
            <IonIcon aria-hidden="true" icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>

          <IonTabButton tab="cart" href="/dashboard/cart">
            <IonIcon aria-hidden="true" icon={cartOutline} />
            <IonLabel>Cart</IonLabel>
            {cartItemCount > 0 && (
              <IonBadge color="primary" style={{ position: "absolute", top: "4px", right: "20px" }}>
                {cartItemCount}
              </IonBadge>
            )}
          </IonTabButton>

          {/* <IonTabButton tab="coins" href="/dashboard/coins">
            <IonIcon aria-hidden="true" icon={diamondOutline} />
            <IonLabel>Ioshiii Coins</IonLabel>
          </IonTabButton> */}

          <IonTabButton tab="account" href="/dashboard/account">
            <IonIcon aria-hidden="true" icon={personOutline} />
            <IonLabel>Account</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonPage>
  )
}

export default Dashboard
