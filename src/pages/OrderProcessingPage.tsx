"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  IonContent,
  IonPage,
  IonText,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonToast,
} from "@ionic/react"
import {
  checkmarkCircleOutline,
  timeOutline,
  restaurantOutline,
  bicycleOutline,
  locationOutline,
  receiptOutline,
  alertCircleOutline,
  refreshOutline,
  homeOutline,
} from "ionicons/icons"
import { useHistory, useParams } from "react-router-dom"
import { AxiosError } from "axios"
import { OrdersApi } from "../api/OrderApi"
// import type { NewOrderApiResponse, NewOrderData } from "../constants/orderInterface"
import "./OrderProcessingPage.css"
import {  NewOrderData } from "../constants/orderHistoryInterface"

interface RouteParams {
  orderId: string
}

const OrderProcessingPage: React.FC = () => {
  const { orderId } = useParams<RouteParams>()
  const history = useHistory()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [orderData, setOrderData] = useState<NewOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [pollingActive, setPollingActive] = useState(true)

  // Processing steps
  const processingSteps = [
    { id: 1, text: "Processing Payment", icon: receiptOutline },
    { id: 2, text: "Confirming Order", icon: checkmarkCircleOutline },
    { id: 3, text: "Preparing Food", icon: restaurantOutline },
    { id: 4, text: "Ready for Delivery", icon: bicycleOutline },
  ]

  useEffect(() => {
    if (!orderId) {
      history.replace("/dashboard/home")
      return
    }

    // Start polling immediately
    pollOrderStatus()

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      if (pollingActive) {
        pollOrderStatus()
      }
    }, 3000) // Poll every 3 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [orderId, pollingActive])

  useEffect(() => {
    // Update current step based on order status
    if (orderData) {
      switch (orderData.status.toLowerCase()) {
        case "pending":
          setCurrentStep(0)
          break
        case "confirmed":
        case "placed":
          setCurrentStep(1)
          break
        case "preparing":
          setCurrentStep(2)
          break
        case "ready":
        case "out_for_delivery":
          setCurrentStep(3)
          break
        default:
          setCurrentStep(0)
      }
    }
  }, [orderData])

  const pollOrderStatus = async () => {
    try {
      setError(null)
      const response = await OrdersApi.getOrderStatus(orderId)

      if (response.data && response.data.length > 0) {
        const order = response.data[0] // Get first order from array
        setOrderData(order)
        setLoading(false)

        // Stop polling if order is completed or failed
        if (
          order.status.toLowerCase() === "delivered" ||
          order.status.toLowerCase() === "cancelled" ||
          order.status.toLowerCase() === "failed"
        ) {
          setPollingActive(false)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
        }
      } else {
        throw new Error("No order data received")
      }
    } catch (error: unknown) {
      
      setLoading(false)

      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || error.message || "Failed to get order status")
      } else {
        setError( "Failed to get order status")
      }

      setToastMessage("Failed to get order status")
      setShowToast(true)

      // Stop polling on error
      setPollingActive(false)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setPollingActive(true)
    pollOrderStatus()

    // Restart polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    pollingIntervalRef.current = setInterval(() => {
      if (pollingActive) {
        pollOrderStatus()
      }
    }, 3000)
  }

  const handleViewOrderDetails = () => {
    history.push(`/orders-history/details/${orderId}`)
  }

  const handleGoHome = () => {
    setPollingActive(false)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    history.replace("/dashboard/home")
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return "completed"
    if (stepIndex === currentStep) return "active"
    return "pending"
  }

  const formatDeliveryTime = () => {
    if (!orderData) return "Calculating..."

    // Estimate delivery time based on status
    const now = new Date()
    const estimatedMinutes = orderData.status.toLowerCase() === "placed" ? 30 : 20
    const deliveryTime = new Date(now.getTime() + estimatedMinutes * 60000)

    return deliveryTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const safeToString = (value: unknown): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && "formatAddress" in value) {
      // @ts-expect-error: formatAddress might not exist on all objects
      return value.formatAddress
    }
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  // Show error state
  if (error && !orderData) {
    return (
      <IonPage className="order-processing-page">
        <IonContent>
          <div className="error-container">
            <IonIcon icon={alertCircleOutline} className="error-icon" />
            <IonText className="error-title">
              <h2>Something went wrong</h2>
            </IonText>
            <IonText className="error-message">
              <p>{error}</p>
            </IonText>
            <IonButton className="retry-button" onClick={handleRetry}>
              <IonIcon icon={refreshOutline} slot="start" />
              Try Again
            </IonButton>
            <IonButton fill="clear" onClick={handleGoHome}>
              <IonIcon icon={homeOutline} slot="start" />
              Go to Home
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  // Show success state when order is placed/confirmed
  if (orderData && (orderData.status.toLowerCase() === "placed" || orderData.status.toLowerCase() === "confirmed")) {
    return (
      <IonPage className="order-processing-page">
        <IonContent>
          <div className="success-container">
            <div className="success-animation">
              <div className="success-circle">
                <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
              </div>
            </div>

            <IonText className="success-title">
              <h1>Order Placed Successfully!</h1>
            </IonText>

            <IonText className="success-subtitle">
              <p>
                Your order has been confirmed and the restaurant is preparing your food. You'll receive updates as your
                order progresses.
              </p>
            </IonText>

            <IonCard className="order-summary-card">
              <IonCardContent>
                <div className="order-summary-header">
                  <IonText>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                      {safeToString(orderData.outletInfo?.outletName || "Restaurant")}
                    </h3>
                  </IonText>
                  <div className="order-id">#{orderData._id.slice(-8)}</div>
                </div>

                <div className="delivery-info">
                  <IonIcon icon={timeOutline} className="delivery-icon" />
                  <div className="delivery-text">
                    <div className="delivery-time">Estimated delivery: {formatDeliveryTime()}</div>
                    <div className="delivery-address">
                      <IonIcon icon={locationOutline} style={{ fontSize: "12px", marginRight: "4px" }} />
                      {safeToString(orderData.outletInfo?.outletAddress)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <IonText style={{ fontSize: "14px", color: "#666" }}>
                    {orderData.items.length} items • ₹{orderData.grandTotal}
                  </IonText>
                  <IonText style={{ fontSize: "12px", color: "#4caf50", fontWeight: "500" }}>Order Confirmed</IonText>
                </div>
              </IonCardContent>
            </IonCard>

            <div className="action-buttons">
              <IonButton className="primary-button" onClick={handleViewOrderDetails}>
                <IonIcon icon={receiptOutline} slot="start" />
                View Order Details
              </IonButton>
              <IonButton className="secondary-button" fill="outline" onClick={handleGoHome}>
                <IonIcon icon={homeOutline} slot="start" />
                Continue Shopping
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  // Show processing state
  return (
    <IonPage className="order-processing-page">
      <IonContent>
        <div className="processing-container">
          <div className="processing-animation">
            <div className="processing-circle"></div>
            <IonIcon icon={restaurantOutline} className="processing-icon" />
          </div>

          <IonText className="processing-title">
            <h2>
              {loading
                ? "Processing Your Order..."
                : orderData?.status.toLowerCase() === "preparing"
                  ? "Preparing Your Order..."
                  : "Confirming Order..."}
            </h2>
          </IonText>

          <IonText className="processing-subtitle">
            <p>
              {loading
                ? "Please wait while we process your order."
                : orderData?.status.toLowerCase() === "preparing"
                  ? "Your order is confirmed! The restaurant is preparing your delicious food."
                  : "We're confirming your order with the restaurant."}
            </p>
          </IonText>

          <div className="status-steps">
            {processingSteps.map((step, index) => (
              <div key={step.id} className={`status-step ${getStepStatus(index)}`}>
                <div className={`step-icon ${getStepStatus(index)}`}>
                  {getStepStatus(index) === "completed" ? (
                    <IonIcon icon={checkmarkCircleOutline} />
                  ) : getStepStatus(index) === "active" ? (
                    <IonSpinner name="crescent" style={{ width: "16px", height: "16px" }} />
                  ) : (
                    <IonIcon icon={step.icon} />
                  )}
                </div>
                <IonText className={`step-text ${getStepStatus(index)}`}>{step.text}</IonText>
              </div>
            ))}
          </div>

          {orderData && (
            <IonCard style={{ width: "100%", maxWidth: "400px", marginTop: "24px" }}>
              <IonCardContent>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <IonText>
                    <h4 style={{ margin: 0, fontSize: "16px" }}>Order #{orderData._id.slice(-8)}</h4>
                  </IonText>
                  <IonText style={{ fontSize: "14px", color: "#666" }}>₹{orderData.grandTotal}</IonText>
                </div>
                <IonText style={{ fontSize: "12px", color: "#999", display: "block", marginTop: "4px" }}>
                  {safeToString(orderData.outletInfo?.outletName || "Restaurant")}
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          <IonText style={{ fontSize: "14px", color: "#999", marginTop: "32px", textAlign: "center" }}>
            <p>This usually takes 2-3 minutes. Please don't close this page.</p>
          </IonText>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
          position="top"
        />
      </IonContent>
    </IonPage>
  )
}

export default OrderProcessingPage
