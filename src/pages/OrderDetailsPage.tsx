"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToast,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
} from "@ionic/react"
import { useParams, useHistory } from "react-router-dom"
import {
  refreshOutline,
  documentTextOutline,
  callOutline,
  closeOutline,
  downloadOutline,
  documentOutline,
  openOutline,
} from "ionicons/icons"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { Browser } from "@capacitor/browser"
import "./OrderDetailsPage.css"
import type { OrderDetail, OrderDetailStatus } from "../constants/order-detail-interface"
import { COLORS } from "../theme/theme"
import LoadingSpinner from "../components/LoadingSpinner"
import { AxiosError } from "axios"
import { OrdersApi } from "../api/OrderApi"

/**
 * Route params: /order-details/:orderId
 */
interface RouteParams {
  orderId: string
}

// Final statuses where polling should stop
const FINAL_STATUSES: OrderDetailStatus[] = ["delivered", "cancelled"]

// Map backend status to a 5-step vertical UI index: 0..4
function statusToStep(status: OrderDetailStatus): number {
  switch (status) {
    case "placed":
    case "awaiting_payment":
      return 0
    case "confirmed":
      return 1
    case "preparing":
    case "food_ready":
      return 2
    case "out_for_delivery":
      return 3
    case "delivered":
    case "cancelled":
      return 4
    default:
      return 0
  }
}

const VERTICAL_STEP_LABELS = ["Placed", "Confirmed", "Food Ready", "Out for Delivery", "Delivered"]

export default function OrderDetailsPage() {
  const { orderId } = useParams<RouteParams>()
  const history = useHistory()

  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  // PDF Modal states
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [showPdfFallback, setShowPdfFallback] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastFetchedAtRef = useRef<number>(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const currentStep = useMemo(() => statusToStep((detail?.status ?? "placed") as OrderDetailStatus), [detail?.status])

  const isFinal = useMemo(() => (detail ? FINAL_STATUSES.includes(detail.status) : false), [detail])

  // Helper function to safely convert any value to string
  const safeToString = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ""
    }
    if (typeof value === "string") {
      return value
    }
    if (typeof value === "object" && value !== null) {
      // Handle address objects that might have formatAddress or other properties
      if (
        typeof value === "object" &&
        value !== null &&
        "formatAddress" in value &&
        typeof (value as { formatAddress?: string }).formatAddress === "string"
      ) {
        return (value as { formatAddress: string }).formatAddress
      }
      if (
        typeof value === "object" &&
        value !== null &&
        "address" in value &&
        typeof (value as { address?: string }).address === "string"
      ) {
        return (value as { address: string }).address
      }
      // Fallback to JSON string representation
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  const fetchDetail = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) setLoading(true)
        setError(null) // Clear previous errors

        const res = await OrdersApi.getOrderDetails(orderId)
        console.log("API Response:", res)
        console.log("res.data:", res.data)

        // Fix: Based on your console output, res.data is directly the order object
        const orderData = res.data as OrderDetail

        if (orderData && orderData._id) {
          setDetail(orderData)
          lastFetchedAtRef.current = Date.now()
          console.log("Order detail set:", orderData)
        } else {
          throw new Error("Order not found in response")
        }
      } catch (e: unknown) {
        console.error("Fetch error:", e)
        const msg = e instanceof AxiosError ? e.response?.data?.message || e.message : "Failed to fetch order details"
        setError(msg)
        if (!opts?.silent) {
          setToastMessage(msg)
          setShowToast(true)
        }
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    [orderId],
  )

  // Initial fetch + start polling if not final
  useEffect(() => {
    if (!orderId) {
      history.replace("/dashboard")
      return
    }
    let ignore = false
    ;(async () => {
      await fetchDetail()
      if (ignore) return
    })()
    return () => {
      ignore = true
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, fetchDetail])

  // Ensure polling state matches status
  useEffect(() => {
    if (!detail) return
    if (FINAL_STATUSES.includes(detail.status)) {
      stopPolling()
    } else if (!pollRef.current) {
      startPolling()
    }
  }, [detail])

  const startPolling = () => {
    stopPolling()
    pollRef.current = setInterval(() => {
      fetchDetail({ silent: true })
    }, 5000)
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const handleManualRefresh = async () => {
    await fetchDetail()
    setToastMessage("Order status refreshed")
    setShowToast(true)
  }

  const handlePullRefresh = async (event: CustomEvent<{ complete: () => void }>) => {
    await fetchDetail()
    event.detail.complete()
  }

  const handleCallDeliveryPartner = () => {
    if (detail?.deliveryPartnerPhone) {
      window.open(`tel:${detail.deliveryPartnerPhone}`, "_self")
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      setPdfLoading(true)
      setPdfError(null)
      setShowPdfFallback(false)

      // Download PDF blob from API
      const pdfBlob = await OrdersApi.downloadInvoice(orderId)

      // Create object URL for PDF
      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      setShowPdfModal(true)

      // Set a timeout to show fallback if PDF doesn't load
      setTimeout(() => {
        if (iframeRef.current) {
          try {
            // Try to access iframe content to check if it loaded
            const iframeDoc = iframeRef.current.contentDocument
            if (!iframeDoc || iframeDoc.body.children.length === 0) {
              setShowPdfFallback(true)
            }
          } catch (e: unknown) {
            // Cross-origin or other error, show fallback
            if(e instanceof Error) {
                setShowPdfFallback(true)
            }
            
          }
        }
      }, 3000)
    } catch (error) {
      console.error("Failed to download invoice:", error)
      setPdfError("Failed to load invoice. Please try again.")
      setToastMessage("Failed to load invoice")
      setShowToast(true)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleClosePdfModal = () => {
    setShowPdfModal(false)
    setShowPdfFallback(false)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setPdfError(null)
  }

  const handleDownloadPdf = async () => {
    if (!pdfUrl || !detail) return

    try {
      const fileName = `invoice_${detail.orderNo || detail._id}.pdf`

      if (Capacitor.isNativePlatform()) {
        // Mobile: Save to device storage
        const response = await fetch(pdfUrl)
        const blob = await response.blob()
        const base64Data = await convertBlobToBase64(blob)

        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        })

        // Share the file
        await Share.share({
          title: "Invoice",
          text: `Invoice for order ${detail.orderNo || detail._id}`,
          url: result.uri,
          dialogTitle: "Save Invoice",
        })

        setToastMessage("Invoice saved to Documents")
      } else {
        // Web: Trigger download
        const link = document.createElement("a")
        link.href = pdfUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setToastMessage("Invoice downloaded")
      }

      setShowToast(true)
    } catch (error) {
      console.error("Failed to download PDF:", error)
      setToastMessage("Failed to save invoice")
      setShowToast(true)
    }
  }

  const handleOpenInBrowser = async () => {
    if (!pdfUrl) return

    try {
      if (Capacitor.isNativePlatform()) {
        // Mobile: Open in system browser
        await Browser.open({ url: pdfUrl })
      } else {
        // Web: Open in new tab
        window.open(pdfUrl, "_blank")
      }
    } catch (error) {
      console.error("Failed to open PDF in browser:", error)
      setToastMessage("Failed to open PDF")
      setShowToast(true)
    }
  }

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1]
          resolve(base64)
        } else {
          reject(new Error("Failed to convert blob to base64"))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const currency = (v: number) => `₹${Number(v ?? 0).toLocaleString("en-IN")}`

  const statusTitle = () => {
    const s = (detail?.status ?? "placed") as OrderDetailStatus
    switch (s) {
      case "placed":
        return "Order Placed"
      case "awaiting_payment":
        return "Awaiting Payment"
      case "confirmed":
        return "Order Confirmed"
      case "preparing":
        return "Food is being prepared"
      case "food_ready":
        return "Food is ready"
      case "out_for_delivery":
        return "Out for Delivery"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Order Cancelled"
      default:
        return "Order Status"
    }
  }

  const verticalSteps = useMemo(() => {
    const isCancelled = detail?.status === "cancelled"
    return VERTICAL_STEP_LABELS.map((label, idx) => {
      const completed = idx < currentStep && !isCancelled
      const current = idx === currentStep && !isCancelled
      const cancelled = isCancelled && idx === VERTICAL_STEP_LABELS.length - 1
      const sub =
        idx === 0
          ? "We received your order"
          : idx === 1
            ? "Restaurant confirmed"
            : idx === 2
              ? "Meal is being prepared"
              : idx === 3
                ? "Handed to delivery partner"
                : isCancelled
                  ? "Order was cancelled"
                  : "Enjoy your meal!"
      return { label, sub, completed, current, cancelled }
    })
  }, [currentStep, detail?.status])

  // Helper function to safely render address
  const renderAddress = (address: unknown, locationName?: string) => {
    const addressText = safeToString(address)
    const locationText = safeToString(locationName)

    if (locationText && addressText) {
      return `${locationText}, ${addressText}`
    }
    return addressText || "Address not available"
  }

  // Helper function to safely render restaurant info
  const renderRestaurantName = (detail: OrderDetail) => {
    return safeToString(detail.outletInfo?.restaurantInfo?.restuarantName) || "Restaurant"
  }

  // Helper function to safely render outlet address
  const renderOutletAddress = (detail: OrderDetail) => {
    const outletAddress = safeToString(detail.outletInfo?.outletAddress)
    const outletName = safeToString(detail.outletInfo?.outletName)
    return outletAddress || outletName || "—"
  }

  // Helper to compute restaurant image src — uses public folder for relative names or full URL if provided
  const getRestaurantImageSrc = (detail: OrderDetail) => {
    const img = detail?.outletInfo?.restaurantInfo?.restuarantImage
    if (!img) return "/restaurant-logo.png"
    try {
      const s = String(img)
      // If it's already an absolute URL, return as-is
      if (s.startsWith("http://") || s.startsWith("https://")) return s
      // Otherwise treat as a path relative to the public folder
      return `/${s.replace(/^\//, "")}`
    } catch {
      return "/restaurant-logo.png"
    }
  }

  // Check if delivery partner info should be shown
  const shouldShowDeliveryPartner = () => {
    return detail?.status === "out_for_delivery" && detail?.deliveryPartnerName && detail?.deliveryPartnerPhone
  }

  // Check if refund status should be shown
  const shouldShowRefundStatus = () => {
    return detail?.status === "cancelled"
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Order</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleManualRefresh} aria-label="Refresh order status">
              {loading ? <IonSpinner name="lines-small" /> : <IonIcon icon={refreshOutline} />}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handlePullRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {!detail && loading ? (
          <div style={{ display: "grid", placeItems: "center", height: "60vh" }}>
            <LoadingSpinner message="Loading order..." />
          </div>
        ) : detail ? (
          <div className="order-details-wrapper">
            <div className="order-card" role="region" aria-label="Order details">
              {/* Header */}
              <div className="order-card-header">
                <img
                  className="restaurant-logo"
                  src={getRestaurantImageSrc(detail) || "/placeholder.svg"}
                  alt="Restaurant logo"
                />
                <div className="header-text">
                  <h2>{renderRestaurantName(detail)}</h2>
                  <p>{renderOutletAddress(detail)}</p>
                </div>
                <div className="order-number-badge">#{detail.orderNo || "Unknown"}</div>
              </div>

              {/* Vertical status stepper */}
              <div className="v-steps" aria-label="Order progress">
                {verticalSteps.map((s, idx) => (
                  <div
                    key={`step-${idx}`}
                    className={`v-step ${s.completed ? "completed" : ""} ${s.current ? "current" : ""} ${
                      s.cancelled ? "cancelled" : ""
                    }`}
                  >
                    <div className="v-bullet">{s.completed || s.current || s.cancelled ? "✓" : ""}</div>
                    <div className="v-content">
                      <div className="v-title">{s.label}</div>
                      <div className="v-sub">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status block */}
              <div className="status-block" aria-live="polite">
                <div
                  className="status-icon"
                  style={{ background: isFinal ? "var(--ion-color-success)" : COLORS.primary }}
                >
                  {isFinal ? "✓" : "●"}
                </div>
                <div className="status-text">
                  <h3>{statusTitle()}</h3>
                  <p>
                    {detail.createdAt ? `Ordered at ${formatTime(detail.createdAt)}` : "We'll keep this updated"}
                    <span className="inline-badge">
                      Last update{" "}
                      {new Date(lastFetchedAtRef.current || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Delivery Partner Section - Only show when out for delivery */}
              {shouldShowDeliveryPartner() && (
                <div className="delivery-partner-section">
                  <h4>Delivery Partner</h4>
                  <div className="delivery-partner-info">
                    <div className="partner-details">
                      <div className="partner-name">{detail.deliveryPartnerName}</div>
                      <div className="partner-phone">{detail.deliveryPartnerPhone}</div>
                    </div>
                    <IonButton
                      className="call-button"
                      fill="solid"
                      onClick={handleCallDeliveryPartner}
                      aria-label="Call delivery partner"
                    >
                      <IonIcon icon={callOutline} />
                    </IonButton>
                  </div>
                </div>
              )}

              {/* Refund Status Section - Only show when cancelled */}
              {shouldShowRefundStatus() && (
                <div className="refund-status-section">
                  <h4>Refund Status</h4>
                  <p>
                    Your refund is being processed and will be credited to your original payment method within 3-5
                    business days.
                  </p>
                </div>
              )}

              {/* Delivering to */}
              <div className="address-block">
                <h4>Delivering to</h4>
                <p>{renderAddress(detail.userAddress, detail.userAddressLocationName)}</p>
              </div>

              {/* Order Summary */}
              <div className="summary">
                <h4>Order Summary</h4>
                {detail.items.map((item, index) => (
                  <div className="summary-row" key={`item-${item._id || index}`}>
                    <span>
                      {safeToString(item.name)} × {item.quantity}
                    </span>
                    <span>{currency((item.price ?? 0) * (item.quantity ?? 0))}</span>
                  </div>
                ))}

                {detail.containerTotal ? (
                  <div className="summary-row muted">
                    <span>Container Charges</span>
                    <span>{currency(detail.containerTotal)}</span>
                  </div>
                ) : null}

                <div className="summary-divider" />

                <div className="summary-row muted">
                  <span>Subtotal</span>
                  <span>{currency(detail.subtotal)}</span>
                </div>
                <div className="summary-row muted">
                  <span>Delivery fee</span>
                  <span>{currency(detail.deliveryFee)}</span>
                </div>
                <div className="summary-row muted">
                  <span>Tax</span>
                  <span>{currency(detail.tax)}</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total</span>
                  <span>{currency(detail.grandTotal)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="actions">
                <div className="refresh-row">
                  <IonButton expand="block" onClick={handleManualRefresh} color="primary">
                    <IonIcon icon={refreshOutline} slot="start" />
                    Refresh status
                  </IonButton>
                  <IonButton
                    expand="block"
                    color="medium"
                    onClick={handleDownloadInvoice}
                    disabled={pdfLoading}
                    aria-label="View invoice"
                  >
                    {pdfLoading ? (
                      <IonSpinner name="lines-small" slot="start" />
                    ) : (
                      <IonIcon icon={documentTextOutline} slot="start" />
                    )}
                    {pdfLoading ? "Loading..." : "View Invoice"}
                  </IonButton>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="error-container">
            <p style={{ color: "var(--ion-color-danger)" }}>{error}</p>
            <IonButton onClick={() => fetchDetail()} color="primary">
              Retry
            </IonButton>
          </div>
        ) : null}

        {/* PDF Modal */}
        <IonModal isOpen={showPdfModal} onDidDismiss={handleClosePdfModal} className="pdf-modal">
          <IonContent>
            <div className="pdf-viewer-container">
              <div className="pdf-viewer-header">
                <div className="pdf-viewer-title">Invoice #{detail?.orderNo || detail?._id?.slice(-6)}</div>
                <div className="pdf-viewer-actions">
                  <IonButton fill="clear" onClick={handleDownloadPdf} aria-label="Download PDF">
                    <IonIcon icon={downloadOutline} />
                  </IonButton>
                  <IonButton fill="clear" onClick={handleOpenInBrowser} aria-label="Open in browser">
                    <IonIcon icon={openOutline} />
                  </IonButton>
                  <IonButton fill="clear" onClick={handleClosePdfModal} aria-label="Close">
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </div>
              </div>

              <div className="pdf-content">
                {pdfLoading ? (
                  <div className="loading-container">
                    <IonSpinner name="crescent" />
                    <p>Loading invoice...</p>
                  </div>
                ) : pdfError ? (
                  <div className="pdf-fallback-container">
                    <IonIcon icon={documentOutline} />
                    <h3>Unable to display PDF</h3>
                    <p>{pdfError}</p>
                    <IonButton onClick={handleDownloadInvoice}>Try Again</IonButton>
                  </div>
                ) : pdfUrl ? (
                  <>
                    {!showPdfFallback && (
                      <iframe
                        ref={iframeRef}
                        src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="pdf-iframe"
                        title="Invoice PDF"
                        onLoad={() => {
                          // Check if iframe loaded successfully after a short delay
                          setTimeout(() => {
                            if (iframeRef.current) {
                              try {
                                const iframeDoc = iframeRef.current.contentDocument
                                if (!iframeDoc || iframeDoc.body.children.length === 0) {
                                  setShowPdfFallback(true)
                                }
                              } catch (e:unknown) {
                                if(e instanceof Error) {
                                    setShowPdfFallback(true)
                                }
                                // If we can't access the iframe content, assume it's working
                                // (this happens with PDF viewers due to cross-origin restrictions)
                                  
                              }
                            }
                          }, 1000)
                        }}
                        onError={() => {
                          console.log("PDF iframe failed to load")
                          setShowPdfFallback(true)
                        }}
                      />
                    )}
                    {showPdfFallback && (
                      <div className="pdf-fallback-container">
                        <IonIcon icon={documentOutline} />
                        <h3>PDF Preview Not Available</h3>
                        <p>
                          Your browser doesn't support PDF preview. You can download or open the invoice using the
                          buttons above.
                        </p>
                        <div className="download-options">
                          <IonButton expand="block" onClick={handleDownloadPdf} color="primary">
                            <IonIcon icon={downloadOutline} slot="start" />
                            Download PDF
                          </IonButton>
                          <IonButton expand="block" onClick={handleOpenInBrowser} fill="outline">
                            <IonIcon icon={openOutline} slot="start" />
                            Open in Browser
                          </IonButton>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pdf-fallback-container">
                    <IonIcon icon={documentOutline} />
                    <h3>No PDF available</h3>
                    <p>Unable to load the invoice PDF.</p>
                  </div>
                )}
              </div>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2200}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  )
}
