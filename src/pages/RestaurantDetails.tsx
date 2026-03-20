"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonModal,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonToast,
  IonImg,
  IonButtons,
} from "@ionic/react"
import {
  search,
  heart,
  heartOutline,
  star,
  time,
  gift,
  add,
  remove,
  close,
  menu,
  chevronDown,
  chevronUp,
  flash,
  chevronForward,
  arrowBack,
  shareOutline,
  storefrontOutline,
  bicycleOutline,
} from "ionicons/icons"
import { useParams, useHistory } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "../store/store"
import { updateCart, setLoading, setError, clearError, clearCart, selectCart } from "../store/slices/cartSlice"
import { authApi } from "../api/AuthApi"
import { OrdersApi } from "../api/OrderApi"
import type { AddToCartPayload } from "../constants/interface"
import "./RestaurantDetails.css"

// Define TypeScript interfaces for our data
interface NutritionalValue {
  energy: number
  carbs: number
  fiber: number
  protein: number
}

interface CustomizationOption {
  name: string
  price: number
}

interface FoodItem {
  _id: string
  itemName: string
  description: string
  defaultPrice: number
  categoryId: string
  isVeg: boolean
  isBestSeller: boolean
  isCustomizable: boolean
  foodImage: string
  preparationTime: string
  weight: number
  containerCharge: number
  customizationOptions: CustomizationOption[]
  nutritionalValue: NutritionalValue
  discountedPrice: number
  discountPercentage: number
  isDiscountActive: boolean
  servingSize: number
}

interface Category {
  id: string
  categoryName: string
  items: FoodItem[]
}

interface Cuisine {
  name: string
  _id: string
}

interface Restaurant {
  _id: string
  restuarantName: string
  cuisine: Cuisine[]
  fssaiImage: string
}

interface Outlet {
  _id: string
  outletName: string
  restId: Restaurant
  status: boolean
  isActive: boolean
}

interface RestaurantDetailsResponse {
  message: string
  data: {
    restaurant: Restaurant
    outlet: Outlet
    distance: string | null
    categories: Category[]
  }
}

interface FavoriteRestaurant {
  outletId: string
  outletName: string
  restaurantName: string
  restaurantImage: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  cuisine: Array<{ name: string; _id: string }>
  email: string
  favoritesCount: number
  isActive: boolean
  outletStatus: string
  ownerName: string
  phoneNumber: string
}

interface SectionData {
  title: string
  id: string
  data: FoodItem[]
  expanded: boolean
}

const RestaurantDetails: React.FC = () => {
  const { outletId, distance } = useParams<{ outletId: string; distance: string }>()
  const history = useHistory()
  const dispatch = useDispatch<AppDispatch>()

  // Redux selectors
  const cartState = useSelector(selectCart)
  const cartItemCount = useSelector((state: RootState) =>
    state.cart.items.reduce((total, item) => total + item.quantity, 0),
  )
  const cartTotal = useSelector((state: RootState) => state.cart.itemTotal)

  // State management
  const [loading, setLoadingState] = useState(true)
  const [error, setErrorState] = useState<string | null>(null)
  const [restaurantData, setRestaurantData] = useState<RestaurantDetailsResponse["data"] | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [vegOnly, setVegOnly] = useState(false)
  const [nonVegOnly, setNonVegOnly] = useState(false)
  const [sections, setSections] = useState<SectionData[]>([])

  // Customization modal state
  const [customizationModalVisible, setCustomizationModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<CustomizationOption[]>([])

  // Favorites state
  const [, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // Toast state
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "danger" | "warning">("success")

  const contentRef = useRef<HTMLIonContentElement>(null)

  // Show toast helper
  const showToast = (message: string, type: "success" | "danger" | "warning" = "success") => {
    console.log("Showing toast:", message, type)
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  // Get item quantity from Redux cart
  const getItemQuantityInCart = (foodItemId: string) => {
    const item = cartState.items.find((item) => item.foodItemId === foodItemId)
    const quantity = item ? item.quantity : 0
    return quantity
  }

  // Load cart data on component mount
  useEffect(() => {
    const loadCartData = async () => {
      try {
        console.log("Loading cart data on component mount...")
        dispatch(setLoading(true))
        const response = await OrdersApi.getCartItems()
        console.log("Cart API response:", response)

        if (response.data && response.data.cart && response.data.cart.items && response.data.cart.items.length > 0) {
          const restaurantName = response.data.cart?.restaurantName ?? response.data.restaurantName ?? ''
          dispatch(
            updateCart({
              outletId: outletId as string,
              containerTotal: response.data.cart.containerTotal,
              itemTotal: response.data.cart.itemTotal,
              subtotal: response.data.cart.subtotal,
              items: response.data.cart.items,
              appliedCharges: response.data.cart?.appliedCharges ?? response.data?.appliedCharges ?? [],
              restaurantName,
            }),
          )
          console.log("Cart data loaded and synced with", response.data.cart.items.length, "items")
        } else {
          console.log("Cart is empty, clearing Redux state")
          dispatch(clearCart())
        }
      } catch (error) {
        console.error("Error loading cart:", error)
      } finally {
        dispatch(setLoading(false))
      }
    }

    if (outletId) {
      loadCartData()
    }
  }, [outletId, dispatch])

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setLoadingState(true)
        const [restaurantResponse, favoritesResponse] = await Promise.all([
          authApi.getRestaurantDetails(outletId as string, distance as string),
          OrdersApi.getAllFaviorites().catch(() => ({ data: [] })),
        ])

        setRestaurantData(restaurantResponse.data)
        console.log("Favorites response:", favoritesResponse)

        const favoriteRestaurantsList = Array.isArray(favoritesResponse.data) ? favoritesResponse.data : []
        console.log("Favorite restaurants list:", favoriteRestaurantsList)
        setFavoriteRestaurants(favoriteRestaurantsList)

        const isCurrentOutletFavorite = favoriteRestaurantsList.some(
          (favRestaurant: FavoriteRestaurant) => favRestaurant.outletId === outletId,
        )
        console.log("Is current outlet favorite:", isCurrentOutletFavorite)
        setIsFavorite(isCurrentOutletFavorite)

        if (restaurantResponse.data.categories && restaurantResponse.data.categories.length > 0) {
          const initialSections = restaurantResponse.data.categories.map((category: Category) => ({
            title: category.categoryName,
            id: category.id,
            data: category.items,
            expanded: true,
          }))
          setSections(initialSections)
          setActiveCategory(restaurantResponse.data.categories[0].id)
        }
      } catch (err) {
        console.error("Failed to fetch restaurant details:", err)
        setErrorState("Failed to load restaurant details. Please try again.")
      } finally {
        setLoadingState(false)
      }
    }

    if (outletId) {
      fetchRestaurantDetails()
    }
  }, [outletId, distance])

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!outletId) {
      showToast("Outlet information not available", "danger")
      return
    }

    setFavoriteLoading(true)
    try {
      const response = await OrdersApi.toggleFaviourites(outletId as string)
      console.log("Toggle favorite response:", response)

      const newFavoriteStatus = !isFavorite
      setIsFavorite(newFavoriteStatus)

      if (newFavoriteStatus) {
        showToast("Restaurant added to favorites", "success")
      } else {
        setFavoriteRestaurants((prev) => prev.filter((favRestaurant) => favRestaurant.outletId !== outletId))
        showToast("Restaurant removed from favorites", "warning")
      }
    } catch (error: unknown) {
      console.error("Error toggling favorite:", error)
      let errorMessage = "Failed to update favorites. Please try again."
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } }
        errorMessage = err.response?.data?.message || errorMessage
      }
      showToast(errorMessage, "danger")
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Add to cart API
  const addToCartAPI = async (item: FoodItem, newQuantity: number) => {
    const payload: AddToCartPayload = {
      foodItemId: item._id,
      quantity: newQuantity,
      forceReplace: false,
      outletId: outletId as string,
    }

    try {
      dispatch(setLoading(true))
      dispatch(clearError())
      console.log("Adding to cart with payload:", payload)
      const response = await OrdersApi.addToCart(payload)
      console.log("Add to cart API response:", response)

      if (response.data) {
        if (response.data.cart) {
          const restaurantName = response.data.cart?.restaurantName ?? response.data.restaurantName ?? ''
          dispatch(
            updateCart({
              outletId: outletId as string,
              containerTotal: response.data.cart.containerTotal,
              itemTotal: response.data.cart.itemTotal,
              subtotal: response.data.cart.subtotal,
              items: response.data.cart.items,
              appliedCharges: response.data.cart?.appliedCharges ?? response.data?.appliedCharges ?? [],
              restaurantName,
            }),
          )
        } else if (response.data.items) {
          const restaurantName = response.data?.restaurantName ?? ''
          dispatch(
            updateCart({
              outletId: outletId as string,
              containerTotal: response.data.containerTotal,
              itemTotal: response.data.itemTotal,
              subtotal: response.data.subtotal,
              items: response.data.items,
              appliedCharges: response.data?.appliedCharges ?? [],
              restaurantName,
            }),
          )
        } else {
          console.log("Unexpected response structure:", response.data)
        }
      }
      showToast(`${item.itemName} added to cart`, "success")
    } catch (error: unknown) {
      console.error("Error adding to cart:", error)
      let errorMessage = "Failed to add item to cart"
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } }
        errorMessage = err.response?.data?.message || errorMessage
      }
      showToast(errorMessage, "danger")
      dispatch(setError(errorMessage))
    } finally {
      dispatch(setLoading(false))
    }
  }

  // Update cart API
  const updateCartAPI = async (item: FoodItem, newQuantity: number) => {
    const payload: AddToCartPayload = {
      foodItemId: item._id,
      quantity: newQuantity,
      forceReplace: true,
      outletId: outletId as string,
    }

    try {
      dispatch(setLoading(true))
      dispatch(clearError())
      console.log("Updating cart with payload:", payload)
      const response = await OrdersApi.addToCart(payload)
      console.log("Update cart API response:", response)

      if (response.data) {
        if (response.data.cart) {
          const restaurantName = response.data.cart?.restaurantName ?? response.data.restaurantName ?? ''
          dispatch(
            updateCart({
              outletId: outletId as string,
              containerTotal: response.data.cart.containerTotal,
              itemTotal: response.data.cart.itemTotal,
              subtotal: response.data.cart.subtotal,
              items: response.data.cart.items,
              appliedCharges: response.data.cart?.appliedCharges ?? response.data?.appliedCharges ?? [],
              restaurantName,
            }),
          )
        } else if (response.data.items) {
          const restaurantName = response.data?.restaurantName ?? ''
          dispatch(
            updateCart({
              outletId: outletId as string,
              containerTotal: response.data.containerTotal,
              itemTotal: response.data.itemTotal,
              subtotal: response.data.subtotal,
              items: response.data.items,
              appliedCharges: response.data?.appliedCharges ?? [],
              restaurantName,
            }),
          )
        } else {
          console.log("Unexpected response structure:", response.data)
        }
      }

      if (newQuantity === 0) {
        showToast(`${item.itemName} removed from cart`, "warning")
      } else {
        showToast(`${item.itemName} quantity updated`, "success")
      }
    } catch (error: unknown) {
      console.error("Error updating cart:", error)
      let errorMessage = "Failed to update cart"
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } }
        errorMessage = err.response?.data?.message || errorMessage
      }
      showToast(errorMessage, "danger")
      dispatch(setError(errorMessage))
    } finally {
      dispatch(setLoading(false))
    }
  }

  // Handle category press
  const handleCategoryPress = (categoryId: string) => {
    setActiveCategory(categoryId)
    setShowMenu(false)
    // Scroll to the selected category
    const element = document.getElementById(`section-${categoryId}`)
    if (element && contentRef.current) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Toggle filters
  const toggleVegOnly = () => {
    setVegOnly(!vegOnly)
    if (!vegOnly) {
      setNonVegOnly(false)
    }
  }

  const toggleNonVegOnly = () => {
    setNonVegOnly(!nonVegOnly)
    if (!nonVegOnly) {
      setVegOnly(false)
    }
  }

  // Toggle section expanded
  const toggleSectionExpanded = (sectionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, expanded: !section.expanded }
        }
        return section
      }),
    )
  }

  // Get delivery time
  const getDeliveryTime = () => {
    return "30 - 35 mins"
  }

  // Customization modal functions
  const openCustomizationModal = (item: FoodItem) => {
    setSelectedItem(item)
    setQuantity(1)
    setSelectedOptions([])
    setCustomizationModalVisible(true)
  }

  const closeCustomizationModal = () => {
    setCustomizationModalVisible(false)
    setSelectedItem(null)
  }

  const toggleOptionSelection = (option: CustomizationOption) => {
    const isSelected = selectedOptions.some((selectedOption) => selectedOption.name === option.name)
    if (isSelected) {
      setSelectedOptions(selectedOptions.filter((selectedOption) => selectedOption.name !== option.name))
    } else {
      setSelectedOptions([...selectedOptions, option])
    }
  }

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0
    const basePrice =
      selectedItem.isDiscountActive && selectedItem.discountedPrice > 0
        ? selectedItem.discountedPrice
        : selectedItem.defaultPrice
    const optionsPrice = selectedOptions.reduce((total, option) => total + option.price, 0)
    return (basePrice + optionsPrice) * quantity
  }

  const addToCart = () => {
    if (!selectedItem) return
    addToCartAPI(selectedItem, quantity)
    closeCustomizationModal()
  }

  const addDirectToCart = (item: FoodItem) => {
    addToCartAPI(item, 1)
  }

  const increaseQuantity = (item: FoodItem) => {
    const currentQuantity = getItemQuantityInCart(item._id)
    updateCartAPI(item, currentQuantity + 1)
  }

  const decreaseQuantity = (item: FoodItem) => {
    const currentQuantity = getItemQuantityInCart(item._id)
    if (currentQuantity > 0) {
      updateCartAPI(item, currentQuantity - 1)
    }
  }

  // Render food item
  const renderFoodItem = (item: FoodItem) => {
    if (vegOnly && !item.isVeg) return null
    if (nonVegOnly && item.isVeg) return null

    const itemQuantity = getItemQuantityInCart(item._id)

    return (
      <div key={item._id} className="food-item-card">
        <div className="food-item-content">
          <div className="food-item-left">
            {/* Veg/Non-veg indicator */}
            <div className={`food-type-indicator ${item.isVeg ? "veg" : "non-veg"}`}>
              <div className="food-type-dot"></div>
            </div>

            {/* Best seller tag */}
            {item.isBestSeller && (
              <div className="bestseller-tag">
                <IonIcon icon={star} />
                <span>Bestseller</span>
              </div>
            )}

            {/* Food details */}
            <h3 className="food-item-name">{item.itemName}</h3>

            <div className="preparation-time">
              <IonIcon icon={time} />
              <span>{item.preparationTime}</span>
            </div>

            <p className="food-description">{item.description || "Delicious food item"}</p>

            {/* Price */}
            <div className="price-container">
              {item.isDiscountActive && item.discountedPrice > 0 ? (
                <>
                  <span className="discounted-price">₹{item.discountedPrice}</span>
                  <span className="original-price">₹{item.defaultPrice}</span>
                </>
              ) : (
                <span className="price">₹{item.defaultPrice}</span>
              )}
            </div>
          </div>

          {/* Food image and controls */}
          <div className="food-item-right">
            <div className="food-image-container">
              <img
                src={item.foodImage || "https://via.placeholder.com/120x120"}
                alt={item.itemName}
                className="food-image"
              />

              {itemQuantity > 0 ? (
                <div className="quantity-controls">
                  <button className="quantity-btn" onClick={() => decreaseQuantity(item)} disabled={cartState.loading}>
                    <IonIcon icon={remove} />
                  </button>
                  <span className="quantity-text">{itemQuantity}</span>
                  <button className="quantity-btn" onClick={() => increaseQuantity(item)} disabled={cartState.loading}>
                    <IonIcon icon={add} />
                  </button>
                </div>
              ) : (
                <button
                  className="add-button"
                  onClick={() => (item.isCustomizable ? openCustomizationModal(item) : addDirectToCart(item))}
                  disabled={cartState.loading}
                >
                  ADD
                </button>
              )}

              {/* Customizable indicator */}
              {item.isCustomizable && (
                <button className="customizable-button" onClick={() => openCustomizationModal(item)}>
                  <span>Customizable</span>
                  <IonIcon icon={chevronDown} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <IonPage>
        <IonContent className="loading-content">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading restaurant details...</IonText>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="error-content">
          <div className="error-container">
            <IonIcon icon={close} size="large" color="danger" />
            <IonText color="danger">{error}</IonText>
            <IonButton onClick={() => history.goBack()}>Go Back</IonButton>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  if (!restaurantData) {
    return (
      <IonPage>
        <IonContent className="error-content">
          <div className="error-container">
            <IonIcon icon={close} size="large" color="danger" />
            <IonText color="danger">Restaurant data not available</IonText>
            <IonButton onClick={() => history.goBack()}>Go Back</IonButton>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  const { restaurant, outlet } = restaurantData

  // Get cuisine names as a comma-separated string
  const getCuisineNames = () => {
    if (!restaurant?.cuisine || restaurant.cuisine.length === 0) return "Multi-cuisine"
    return restaurant.cuisine.map((c) => c.name).join(", ")
  }

  return (
    <IonPage>
      <IonContent ref={contentRef} className="restaurant-content" fullscreen>
        {/* Hero Section with Restaurant Image */}
        <div className="restaurant-hero">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
            alt={restaurant?.restuarantName}
            className="restaurant-hero-image"
          />
          <div className="restaurant-hero-overlay" />

          {/* Header with back and action buttons */}
          <div className="restaurant-hero-header">
            <button className="hero-back-btn" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} />
            </button>
            <div className="hero-actions">
              <button className="hero-action-btn">
                <IonIcon icon={search} />
              </button>
              <button className="hero-action-btn">
                <IonIcon icon={shareOutline} />
              </button>
              <button
                className={`hero-action-btn ${isFavorite ? 'favorite' : ''}`}
                onClick={toggleFavorite}
                disabled={favoriteLoading}
              >
                {favoriteLoading ? (
                  <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
                ) : (
                  <IonIcon icon={isFavorite ? heart : heartOutline} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant Info Card */}
        <div className="restaurant-info-card">
          <div className="restaurant-main-info">
            <h1 className="restaurant-name">{restaurant?.restuarantName || "Restaurant"}</h1>
            <p className="restaurant-cuisines">{getCuisineNames()}</p>

            <div className="restaurant-meta">
              <div className="rating-badge">
                <IonIcon icon={star} />
                <span>4.2</span>
              </div>
              <span className="rating-count">(1.2K+ ratings)</span>
              <span className="meta-separator" />
              <div className="delivery-time">
                <IonIcon icon={time} />
                <span>{getDeliveryTime()}</span>
              </div>
            </div>
          </div>

          {/* Outlet Info */}
          <div className="outlet-info">
            <div className="outlet-details">
              <div className="outlet-icon">
                <IonIcon icon={storefrontOutline} />
              </div>
              <div className="outlet-text">
                <h4>{outlet?.outletName || "Outlet"}</h4>
                <p>Outlet</p>
              </div>
            </div>
            <span className="outlet-distance">{distance || "0.00"} km</span>
          </div>
        </div>

        {/* Offers Section */}
        <div className="offers-section">
          <h3 className="section-title">Deals for you</h3>
          <div className="offers-scroll">
            <div className="offer-card">
              <div className="offer-icon">
                <IonIcon icon={bicycleOutline} />
              </div>
              <div className="offer-content">
                <h4>Free Delivery</h4>
                <p>On orders above ₹199</p>
              </div>
            </div>
            <div className="offer-card">
              <div className="offer-icon">
                <IonIcon icon={gift} />
              </div>
              <div className="offer-content">
                <h4>20% OFF up to ₹50</h4>
                <p>Use code WELCOME</p>
              </div>
            </div>
            <div className="offer-card">
              <div className="offer-icon">
                <IonIcon icon={flash} />
              </div>
              <div className="offer-content">
                <h4>₹75 OFF</h4>
                <p>On orders above ₹249</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        <div className="filter-section">
          <div className={`filter-chip ${vegOnly ? "active" : ""}`} onClick={toggleVegOnly}>
            <span className="veg-icon" />
            <span>Veg</span>
          </div>

          <div className={`filter-chip ${nonVegOnly ? "active" : ""}`} onClick={toggleNonVegOnly}>
            <span className="nonveg-icon" />
            <span>Non-Veg</span>
          </div>

          <div className="filter-chip">
            <IonIcon icon={star} />
            <span>Bestseller</span>
          </div>

          <div className="filter-chip">
            <IonIcon icon={flash} />
            <span>Quick Bites</span>
          </div>
        </div>

        {/* Categories and Food Items */}
        {sections.map((section) => (
          <div key={section.id} id={`section-${section.id}`} className="category-section">
            <div className="category-header" onClick={() => toggleSectionExpanded(section.id)}>
              <div className="category-info">
                <h2>{section.title}</h2>
                <p>
                  {section.data.filter((item) => (!vegOnly || item.isVeg) && (!nonVegOnly || !item.isVeg)).length} items
                </p>
              </div>
              <IonIcon icon={section.expanded ? chevronUp : chevronDown} />
            </div>

            {section.expanded && (
              <div className="category-content">
                {section.data.length > 0 ? (
                  section.data
                    .filter((item) => (!vegOnly || item.isVeg) && (!nonVegOnly || !item.isVeg))
                    .map((item) => renderFoodItem(item))
                ) : (
                  <div className="empty-section">
                    <span>No items available in this category</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Spacer for cart bar */}
        <div style={{ height: cartItemCount > 0 ? 80 : 20 }} />
      </IonContent>

      {/* Menu FAB - Outside IonContent for reliable positioning */}
      <div className="menu-fab-container" onClick={() => setShowMenu(true)}>
        <IonIcon icon={menu} />
        <span>Menu</span>
      </div>

      {/* Cart Bottom Bar */}
      {cartItemCount > 0 && (
        <div className="cart-bottom-bar" onClick={() => history.push("/dashboard/cart")}>
          <div className="cart-left">
            <div className="cart-items-text">
              {cartItemCount} Item{cartItemCount > 1 ? "s" : ""} | ₹{cartTotal}
            </div>
            <div className="cart-total">Extra charges may apply</div>
          </div>
          <div className="cart-right">
            <span>View Cart</span>
            <IonIcon icon={chevronForward} />
          </div>
        </div>
      )}

      {/* Menu Modal */}
      <IonModal isOpen={showMenu} onDidDismiss={() => setShowMenu(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>MENU</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowMenu(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {sections.map((section) => (
              <IonItem
                key={section.id}
                button
                onClick={() => handleCategoryPress(section.id)}
                className={activeCategory === section.id ? "active-category" : ""}
              >
                <IonLabel>
                  <h3>{section.title}</h3>
                  <p>{section.data.length} items</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonModal>

      {/* Customization Modal */}
      <IonModal isOpen={customizationModalVisible} onDidDismiss={closeCustomizationModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{selectedItem?.itemName}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeCustomizationModal}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {selectedItem && (
            <>
              <IonImg
                src={selectedItem.foodImage || "https://via.placeholder.com/300"}
                alt={selectedItem.itemName}
                className="customization-image"
              />

              <div className="customization-content">
                <IonText>
                  <p>{selectedItem.description}</p>
                </IonText>

                {/* Customization Options */}
                {selectedItem.customizationOptions && selectedItem.customizationOptions.length > 0 ? (
                  <div className="options-container">
                    <IonText>
                      <h3>Customization Options</h3>
                    </IonText>
                    {selectedItem.customizationOptions.map((option, index) => (
                      <IonItem key={index} button onClick={() => toggleOptionSelection(option)}>
                        <IonCheckbox
                          checked={selectedOptions.some((selectedOption) => selectedOption.name === option.name)}
                          slot="start"
                        />
                        <IonLabel>
                          <h3>{option.name}</h3>
                          <p>+₹{option.price}</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </div>
                ) : (
                  <IonText color="medium">
                    <p>No customization options available</p>
                  </IonText>
                )}

                {/* Nutritional Information */}
                {selectedItem.nutritionalValue && (
                  <div className="nutrition-container">
                    <IonText>
                      <h3>Nutritional Information</h3>
                    </IonText>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <div className="nutrition-item">
                            <IonText>
                              <h4>{selectedItem.nutritionalValue.energy}</h4>
                              <p>Calories</p>
                            </IonText>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="nutrition-item">
                            <IonText>
                              <h4>{selectedItem.nutritionalValue.protein}g</h4>
                              <p>Protein</p>
                            </IonText>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="nutrition-item">
                            <IonText>
                              <h4>{selectedItem.nutritionalValue.carbs}g</h4>
                              <p>Carbs</p>
                            </IonText>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div className="nutrition-item">
                            <IonText>
                              <h4>{selectedItem.nutritionalValue.fiber}g</h4>
                              <p>Fiber</p>
                            </IonText>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </div>
                )}
              </div>

              {/* Footer with quantity and add to cart */}
              <div className="customization-footer">
                <div className="quantity-selector">
                  <IonButton
                    fill="outline"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <IonIcon icon={remove} />
                  </IonButton>
                  <IonText className="quantity-text">{quantity}</IonText>
                  <IonButton fill="outline" onClick={() => setQuantity(quantity + 1)}>
                    <IonIcon icon={add} />
                  </IonButton>
                </div>
                <IonButton
                  expand="block"
                  onClick={addToCart}
                  disabled={cartState.loading}
                  className="add-to-cart-button"
                >
                  Add to Cart • ₹{calculateTotalPrice()}
                </IonButton>
              </div>
            </>
          )}
        </IonContent>
      </IonModal>

      {/* Toast */}
      <IonToast
        isOpen={toastVisible}
        onDidDismiss={() => setToastVisible(false)}
        message={toastMessage}
        duration={2000}
        color={toastType}
      />

      {/* Loading overlay */}
      {cartState.loading && (
        <div className="loading-overlay">
          <IonSpinner name="crescent" />
        </div>
      )}
    </IonPage>
  )
}

export default RestaurantDetails
