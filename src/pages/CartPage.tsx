"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  IonContent,
  IonText,
  IonItem,
  IonInput,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonModal,
  IonList,
  IonToast,
  IonButtons,
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react"
import {
  locationOutline,
  homeOutline,
  briefcaseOutline,
  chevronForwardOutline,
  closeOutline,
  addCircleOutline,
  cartOutline,
  arrowBack,
  walletOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
} from "ionicons/icons"
import { useHistory } from "react-router-dom"
import { useAppSelector } from "../hooks/useAppSelector"
import { useAppDispatch } from "../hooks/useAppDispatch"
import { selectCart, updateCart, setError } from "../store/slices/cartSlice"
import { OrdersApi } from "../api/OrderApi"
import { COLORS } from "../theme/theme"
import { fetchSavedAddresses, setSelectedAddress } from "../store/slices/locationSlice"
import { CreateOrderPayload } from "../constants/interface"
import { PaymentService } from "../utills/PaymentService"

interface CartItem {
  containerCharge: number;
  containerTotal: number;
  foodItemId: string;
  itemTotal: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  cookingRequest?: string;
  foodImage?: string;
  isVeg?: boolean;
  customizable?: boolean;
}


interface Address {
  id: string
  locationName: string
  fullAddress: string
  houseFlatFloorNo: string
  apartmentRoadArea: string
  location: {
    type: string
    coordinates: [number, number]
  }
  directionsToReach?: string
  addressType: string
  phoneNumber?: string
}

const CartPage: React.FC = () => {
  const history = useHistory()
  const dispatch = useAppDispatch()
  // Get cart items from Redux cart slice
  const cartState = useAppSelector(selectCart)
  // Accept cart items from Redux, fallback to empty array
  const [cartItems, setCartItems] = useState<CartItem[]>(cartState.items ? cartState.items.map(item => ({
    ...item,
  })) : [])

  // Get addresses and selected address from Redux
  const savedAddresses = useAppSelector((state) => state.location.savedAddresses)
  const selectedAddressRedux = useAppSelector((state) => state.location.selectedAddress)

  // Get loyalty data from dashboard
  const loyaltyData = useAppSelector((state) => state.dashboard.staticData?.loyalty)

  // Local state for selected address (for modal selection)
  const [selectedAddress, setSelectedAddressLocal] = useState<Address | null>(selectedAddressRedux)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [cookingRequest, setCookingRequest] = useState("")
  const [loading, setLoading] = useState(false)
  const [applyCoins, setApplyCoins] = useState(false)
  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    color: "primary" as "primary" | "success" | "warning" | "danger",
  })

  const showToast = (message: string, color: "primary" | "success" | "warning" | "danger" = "primary") => {
    setToast({ isOpen: true, message, color })
  }

  useEffect(() => {
    console.log(cartState)
    // Sync local state with Redux cart items, ensure shape matches local CartItem interface
    setCartItems(cartState.items ? cartState.items.map(item => ({
      ...item,
    })) : [])
  }, [cartState.items])

  // Sync selected address from Redux
  useEffect(() => {
    setSelectedAddressLocal(selectedAddressRedux)
  }, [selectedAddressRedux])

  // Fetch addresses on mount if not loaded
  useEffect(() => {
    if (!savedAddresses || savedAddresses.length === 0) {
      dispatch(fetchSavedAddresses())
    }
  }, [dispatch, savedAddresses])

  const updateQuantity = async (foodItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(foodItemId)
      return
    }

    setLoading(true)
    try {
      // Find the item to update
      const item = cartItems.find((i) => i.foodItemId === foodItemId)
      if (!item) return
      // Prepare payload for API
      const payload = {
        foodItemId: item.foodItemId,
        quantity: newQuantity,
        forceReplace: false,
        outletId: cartState.outletId || "",
      }
      const response = await OrdersApi.addToCart(payload)
      console.log('-----------',response.data?.items)
      if (response.data && (response.data.items && response.data.items.length > 0 || response.data.cart && response.data.cart.items && response.data.cart.items.length > 0) ) {
        // Prefer response.data.cart when available
        if (response.data.cart) {
          dispatch(updateCart({
            outletId: response.data.cart.outletId || null,
            containerTotal: response.data.cart.containerTotal || 0,
            itemTotal: response.data.cart.itemTotal || 0,
            subtotal: response.data.cart.subtotal || 0,
            items: response.data.cart.items || [],
            restaurantName: response.data.cart.restaurantName || response.data.restaurantName || '',
            appliedCharges: response.data.cart.appliedCharges || [],
          }))
        } else {
          dispatch(updateCart({
            outletId: response.data.outletId || null,
            containerTotal: response.data.containerTotal || 0,
            itemTotal: response.data.itemTotal || 0,
            subtotal: response.data.subtotal || 0,
            items: response.data.items || [],
            restaurantName: response.data.restaurantName || '',
            appliedCharges: response.data.appliedCharges || [],
          }))
        }
        showToast("Cart updated", "success")
      }  else {
        showToast("Failed to update cart", "danger")
      }
    } catch (error: unknown) {
      dispatch(setError((error as Error).message || "Failed to update cart"))
      showToast("Failed to update cart", "danger")
    } finally {
      setLoading(false)
    }
  }

  const removeItem = (foodItemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.foodItemId !== foodItemId))
    showToast("Item removed from cart", "primary")
  }

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      showToast("Please enter a promo code", "warning")
      return
    }
    // Mock promo code application
    showToast("Promo code applied successfully!", "success")
  }

  const proceedToCheckout = async() => {
    // history.push("/order-processing/689460ad78996a80ed4d29cb");
    if (!selectedAddress?.id) {
      showToast("Please select a delivery address", "warning")
      return
    }
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "warning")
      return
    }

    setLoading(true)
    const payload: CreateOrderPayload = {
      addressId: selectedAddress.id,
      outletId: cartState.outletId || "",
    }

    try {
      const createOrderResponse = await OrdersApi.createOrder(payload);
      console.log(createOrderResponse);
      await PaymentService.initiatePayment(
        createOrderResponse.data?.razorpayOrderId,
        createOrderResponse.data?.amount,
        {
          name: createOrderResponse.data?.name,
          email: createOrderResponse.data?.email,
          contact: createOrderResponse.data?.phoneNumber,
        },
        selectedAddress.id,
        () => {
          // Handle payment success
          history.push(`/order-processing/${createOrderResponse.data?.orderId}`)
          // showToast("Payment successful!", "success");
          // history.push("/dashboard");
        },
        (error) => {
          // Handle payment failure
          if(error instanceof Error) {
            showToast("Payment failed. Please try again.", "danger");
            setLoading(false);
          }
        }
      );

    } catch (error: unknown) {
      setLoading(false)
      showToast((error as Error).message || "Failed to create order", "danger")
      return
      
    }
    
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return homeOutline
      case "work":
        return briefcaseOutline
      default:
        return locationOutline
    }
  }

  // Calculate totals
  const itemTotal = cartItems.reduce((sum, item) => sum + item.itemTotal, 0)
  const containerTotal = cartItems.reduce((sum, item) => sum + item.containerTotal, 0)
  const deliveryFee = 29
  // Include appliedCharges totals if present in cart state
  const appliedCharges = cartState.appliedCharges ?? []
  const appliedChargesTotal = appliedCharges.reduce((sum, ch) => sum + (ch.totalAmount ?? ch.amount ?? 0), 0)
  const grandTotal = itemTotal + containerTotal + deliveryFee + appliedChargesTotal

  if (loading) {
    return (
      <IonContent style={{ "--background": COLORS.background }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "40px" }}>
          <IonSpinner name="crescent" color="primary" />
          <IonText style={{ marginTop: "16px", color: COLORS.text }}>Updating cart...</IonText>
        </div>
      </IonContent>
    )
  }
  if (!loading && cartItems.length === 0) {
    return (
      <>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={() => history.goBack()}>
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Cart</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ "--background": COLORS.background }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <IonIcon
              icon={cartOutline}
              style={{
                fontSize: "80px",
                color: COLORS.gray,
                marginBottom: "24px",
              }}
            />
            <IonText>
              <h2 style={{ color: COLORS.text, margin: "0 0 16px 0" }}>Your cart is empty</h2>
            </IonText>
            <IonText>
              <p style={{ color: COLORS.gray, margin: "0 0 32px 0" }}>Browse restaurants and add items to your cart</p>
            </IonText>
            <IonButton
              expand="block"
              onClick={() => history.push("/dashboard")}
              style={{
                "--background": COLORS.primary,
                "--color": "white",
                maxWidth: "300px",
              }}
            >
              Browse Restaurants
            </IonButton>
          </div>
        </IonContent>
      </>
    )
  }

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Cart</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ "--background": "#f5f5f5" }}>
        {/* Restaurant Header */}
        <div
          style={{
            padding: "20px 16px 16px 16px",
            backgroundColor: "white",
            marginBottom: "8px",
          }}
        >
          <IonText>
            <h1 style={{ margin: "0", color: "#000", fontSize: "24px", fontWeight: "bold" }}>{cartState.restaurantName}</h1>
          </IonText>
        </div>

        {/* Address Section - At Top */}
        <IonCard style={{ margin: "0 16px 8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <IonCardContent style={{ padding: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <IonIcon
                  icon={locationOutline}
                  style={{ fontSize: "16px", color: COLORS.primary, marginRight: "8px" }}
                />
                <IonText style={{ fontSize: "16px", fontWeight: "600", color: COLORS.text }}>
                  Delivery Address
                </IonText>
              </div>
              {selectedAddress && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setShowAddressModal(true)}
                  style={{
                    "--color": COLORS.primary,
                    "--padding-start": "8px",
                    "--padding-end": "8px",
                    height: "32px",
                    fontSize: "14px",
                  }}
                >
                  Change
                </IonButton>
              )}
            </div>
            {selectedAddress ? (
              <div style={{ display: "flex", alignItems: "center", marginLeft: "24px" }}>
                <IonIcon
                  icon={getAddressIcon(selectedAddress.addressType)}
                  style={{ fontSize: "14px", color: COLORS.gray, marginRight: "8px" }}
                />
                <div>
                  <IonText style={{ fontSize: "14px", fontWeight: "500", color: COLORS.text }}>
                    {selectedAddress.locationName}
                  </IonText>
                  <IonText style={{ fontSize: "13px", color: COLORS.gray, display: "block", lineHeight: "1.3" }}>
                    {selectedAddress.houseFlatFloorNo}, {selectedAddress.apartmentRoadArea}
                  </IonText>
                </div>
              </div>
            ) : (
              <div style={{ marginLeft: "24px" }}>
                <IonText style={{ fontSize: "14px", color: COLORS.gray, display: "block", marginBottom: "12px" }}>
                  No delivery address selected
                </IonText>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {savedAddresses && savedAddresses.length > 0 ? (
                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => setShowAddressModal(true)}
                      style={{
                        "--border-color": COLORS.primary,
                        "--color": COLORS.primary,
                        height: "36px",
                        fontSize: "13px",
                      }}
                    >
                      <IonIcon icon={locationOutline} slot="start" style={{ fontSize: "16px" }} />
                      Select Address
                    </IonButton>
                  ) : null}
                  <IonButton
                    fill="solid"
                    size="small"
                    onClick={() => history.push("/select-location")}
                    style={{
                      "--background": COLORS.primary,
                      "--color": "white",
                      height: "36px",
                      fontSize: "13px",
                    }}
                  >
                    <IonIcon icon={addCircleOutline} slot="start" style={{ fontSize: "16px" }} />
                    Add New Address
                  </IonButton>
                </div>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Cart Items - Updated Layout to Match Reference */}
        <div style={{ backgroundColor: "white", margin: "0 16px 8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          {cartItems.map((item, index) => (
            <div key={item.foodItemId}>
              <div style={{ padding: "20px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  {/* Left Side - Item Details */}
                  <div style={{ flex: 1, paddingRight: "16px" }}>
                    {/* Veg Indicator and Item Name */}
                    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          border: "2px solid #4caf50",
                          borderRadius: "3px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "12px",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#4caf50",
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <IonText
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#000",
                            lineHeight: "1",
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          {item.name}
                        </IonText>
                        {/* Description */}
                        <IonText
                          style={{
                            fontSize: "14px",
                            color: "#666",
                            lineHeight: "1.4",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          {item.description}
                        </IonText>
                        {/* Tap to Customize */}
                        {item.customizable && (
                          <IonText
                            style={{
                              fontSize: "14px",
                              color: "#000",
                              fontWeight: "500",
                              display: "block",
                            }}
                          >
                            Tap to Customize
                          </IonText>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Price and Quantity */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                    {/* Price */}
                    <IonText style={{ fontSize: "18px", fontWeight: "600", color: "#000" }}>₹{item.price}</IonText>

                    {/* Quantity Controls */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "white",
                      }}
                    >
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => updateQuantity(item.foodItemId, item.quantity - 1)}
                        style={{
                          "--color": "#666",
                          width: "25px",
                          height: "30px",
                          margin: "0",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        −
                      </IonButton>
                      <IonText
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#000",
                          minWidth: "30px",
                          textAlign: "center",
                          margin: "0 4px",
                        }}
                      >
                        {item.quantity}
                      </IonText>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => updateQuantity(item.foodItemId, item.quantity + 1)}
                        style={{
                          "--color": "#666",
                          width: "25px",
                          height: "30px",
                          margin: "0",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        +
                      </IonButton>
                    </div>
                  </div>
                </div>
              </div>
              {/* Divider between items */}
              {index < cartItems.length - 1 && (
                <div style={{ height: "1px", backgroundColor: "#f0f0f0", margin: "0 16px" }} />
              )}
            </div>
          ))}
        </div>

        {/* Cooking Request */}
        <IonCard style={{ margin: "8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <IonCardContent style={{ padding: "16px" }}>
            <IonText
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: COLORS.text,
                display: "block",
                marginBottom: "12px",
              }}
            >
              Cooking Request
            </IonText>
            <IonTextarea
              placeholder="Any special cooking instructions for your order?"
              value={cookingRequest}
              onIonInput={(e) => setCookingRequest(e.detail.value!)}
              rows={3}
              style={{
                "--background": COLORS.background,
                "--color": COLORS.text,
                "--placeholder-color": COLORS.gray,
                border: `1px solid ${COLORS.lightGray}`,
                borderRadius: "8px",
                padding: "12px",
              }}
            />
          </IonCardContent>
        </IonCard>

        {/* Promo Code */}
        <IonCard style={{ margin: "8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <IonCardContent style={{ padding: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <IonInput
                placeholder="Enter promo code"
                value={promoCode}
                onIonInput={(e) => setPromoCode(e.detail.value!)}
                style={{
                  flex: 1,
                  "--background": COLORS.background,
                  "--color": COLORS.text,
                  "--placeholder-color": COLORS.gray,
                  border: `1px solid ${COLORS.lightGray}`,
                  borderRadius: "8px",
                  padding: "12px",
                }}
              />
              <IonButton
                onClick={applyPromoCode}
                style={{
                  "--background": COLORS.primary,
                  "--color": "white",
                  height: "48px",
                  borderRadius: "8px",
                }}
              >
                Apply
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Coins Section */}
        {loyaltyData && (
          <IonCard style={{ margin: "8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <IonCardContent style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                    }}
                  >
                    <IonIcon icon={walletOutline} style={{ fontSize: "20px", color: "#fff" }} />
                  </div>
                  <div>
                    <IonText
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: COLORS.text,
                        display: "block",
                      }}
                    >
                      Available Coins
                    </IonText>
                    <IonText
                      style={{
                        fontSize: "14px",
                        color: COLORS.gray,
                        display: "block",
                      }}
                    >
                      {loyaltyData.currentBalance || 0} coins = ₹{((loyaltyData.currentBalance || 0) / 10).toFixed(2)}
                    </IonText>
                  </div>
                </div>
                <div
                  onClick={() => {
                    if (loyaltyData.currentBalance && loyaltyData.currentBalance > 0) {
                      setApplyCoins(!applyCoins)
                    }
                  }}
                  style={{
                    cursor: loyaltyData.currentBalance && loyaltyData.currentBalance > 0 ? "pointer" : "not-allowed",
                    opacity: loyaltyData.currentBalance && loyaltyData.currentBalance > 0 ? 1 : 0.5,
                  }}
                >
                  <IonIcon
                    icon={applyCoins ? checkmarkCircle : checkmarkCircleOutline}
                    style={{
                      fontSize: "28px",
                      color: applyCoins ? "#4CAF50" : COLORS.gray,
                    }}
                  />
                </div>
              </div>
              {applyCoins && loyaltyData.currentBalance && loyaltyData.currentBalance > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    backgroundColor: "#e8f5e9",
                    borderRadius: "8px",
                  }}
                >
                  <IonText style={{ fontSize: "13px", color: "#2e7d32", fontWeight: "500" }}>
                    {loyaltyData.currentBalance} coins will be applied. Eligible amount will be calculated at checkout.
                  </IonText>
                </div>
              )}
              {(!loyaltyData.currentBalance || loyaltyData.currentBalance === 0) && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    backgroundColor: "#fff3e0",
                    borderRadius: "8px",
                  }}
                >
                  <IonText style={{ fontSize: "13px", color: "#e65100" }}>
                    No coins available. Earn coins on every order!
                  </IonText>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Order Summary */}
        <IonCard style={{ margin: "8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <IonCardContent style={{ padding: "16px" }}>
            <IonText
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: COLORS.text,
                display: "block",
                marginBottom: "16px",
              }}
            >
              Order Summary
            </IonText>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <IonText style={{ color: COLORS.gray, fontSize: "15px" }}>Item Total</IonText>
              <IonText style={{ color: COLORS.text, fontSize: "15px", fontWeight: "500" }}>₹{itemTotal}</IonText>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <IonText style={{ color: COLORS.gray, fontSize: "15px" }}>Container Charges</IonText>
              <IonText style={{ color: COLORS.text, fontSize: "15px", fontWeight: "500" }}>₹{containerTotal}</IonText>
            </div>
            {cartState.appliedCharges && cartState.appliedCharges.length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                {cartState.appliedCharges.map((ch) => (
                  <div key={ch.chargeId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <IonText style={{ color: COLORS.gray, fontSize: "15px" }}>{ch.name}</IonText>
                    <IonText style={{ color: COLORS.text, fontSize: "15px", fontWeight: "500" }}>₹{ch.totalAmount}</IonText>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <IonText style={{ color: COLORS.gray, fontSize: "15px" }}>Delivery Fee</IonText>
              <IonText style={{ color: COLORS.text, fontSize: "15px", fontWeight: "500" }}>₹{deliveryFee}</IonText>
            </div>
            <hr style={{ border: "none", borderTop: `1px solid ${COLORS.lightGray}`, margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <IonText style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.text }}>Total</IonText>
              <IonText style={{ fontSize: "18px", fontWeight: "bold", color: COLORS.primary }}>₹{grandTotal}</IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Checkout Button */}
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            marginTop: "16px",
            borderTop: `1px solid ${COLORS.lightGray}`,
            boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
            marginBottom: "40px"
          }}
        >
          <IonButton
            expand="block"
            onClick={proceedToCheckout}
            disabled={loading || !selectedAddress}
            style={{
              "--background": COLORS.primary,
              "--color": "white",
              height: "52px",
              fontSize: "16px",
              fontWeight: "600",
              margin: "0",
              borderRadius: "8px",
            }}
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: "8px" }} />
                Processing...
              </>
            ) : (
              `Proceed to Checkout - ₹${grandTotal}`
            )}
          </IonButton>
        </div>

        {/* Address Selection Modal */}
        <IonModal isOpen={showAddressModal} onDidDismiss={() => setShowAddressModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Delivery Address</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={() => setShowAddressModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {savedAddresses && savedAddresses.length > 0 ? (
                savedAddresses.map((address) => (
                  <IonItem
                    key={address.id}
                    button
                    onClick={() => {
                      setSelectedAddressLocal(address)
                      dispatch(setSelectedAddress(address))
                      setShowAddressModal(false)
                      showToast("Address selected", "success")
                    }}
                    style={{ "--background": COLORS.white }}
                  >
                    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "20px",
                          backgroundColor: COLORS.lightGray,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "12px",
                        }}
                      >
                        <IonIcon icon={getAddressIcon(address.addressType)} style={{ color: COLORS.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <IonText style={{ fontSize: "16px", fontWeight: "600", color: COLORS.text, display: "block" }}>
                          {address.locationName}
                        </IonText>
                        <IonText style={{ fontSize: "14px", color: COLORS.gray, display: "block" }}>
                          {address.houseFlatFloorNo}, {address.apartmentRoadArea}
                        </IonText>
                      </div>
                      <IonIcon icon={chevronForwardOutline} style={{ color: COLORS.gray }} />
                    </div>
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonText>No saved addresses found.</IonText>
                </IonItem>
              )}
              <IonItem
                button
                onClick={() => {
                  setShowAddressModal(false)
                  history.push("/add-address")
                }}
                style={{ "--background": COLORS.white }}
              >
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "20px",
                      backgroundColor: COLORS.lightGray,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                    }}
                  >
                    <IonIcon icon={addCircleOutline} style={{ color: COLORS.primary }} />
                  </div>
                  <IonText style={{ fontSize: "16px", fontWeight: "600", color: COLORS.primary }}>
                    Add New Address
                  </IonText>
                </div>
              </IonItem>
            </IonList>
          </IonContent>
        </IonModal>

        {/* Toast */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })}
          message={toast.message}
          duration={2000}
          color={toast.color}
        />
      </IonContent>
    </>
  )
}

export default CartPage

