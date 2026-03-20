"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useHistory, useLocation } from "react-router-dom"
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonText,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonSpinner,
  IonChip,
  IonProgressBar,
  IonBadge,
  IonLabel,
} from "@ionic/react"
import {
  walletOutline,
  timeOutline,
  giftOutline,
  restaurantOutline,
  personAddOutline,
  trophyOutline,
  chevronDownOutline,
  starOutline,
  medalOutline,
  arrowBackOutline,
} from "ionicons/icons"
import { COLORS } from "../theme/theme"
import type { LoyaltyData, CoinsFilter, CoinsTransaction } from "../constants/coinsInterface"
import { RatingApi } from "../api/RatingsApi"
interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

const CoinsPage: React.FC = () => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CoinsFilter>("all")
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const history = useHistory()
  const location = useLocation()

  useEffect(() => {
    loadLoyaltyData()
  }, [])

  const loadLoyaltyData = async () => {
    try {
      setLoading(true)
      const response = await RatingApi.getLoyaltyCoins()
      setLoyaltyData(response.data)
    } catch (error) {
      console.error("Failed to load loyalty data:", error)
      showToast("Failed to load coins data", "danger")
    } finally {
      setLoading(false)
    }
  }

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

  const handleRefresh = async (event: CustomEvent) => {
    await loadLoyaltyData()
    event.detail.complete()
  }

  const handleReferNow = () => {
    showToast("Referral feature coming soon!", "primary")
  }

  const handleBackClick = () => {
    // Check if there's a referrer in the location state
    const state = location.state as { from?: string } | undefined
    const from = state?.from

    if (from === "account") {
      history.push("/dashboard/account")
    } else if (from === "dashboard") {
      history.push("/dashboard")
    } else {
      // Default fallback - check if we can go back in history
      if (history.length > 1) {
        history.goBack()
      } else {
        history.push("/dashboard")
      }
    }
  }

  const getTransactionIcon = (transaction: CoinsTransaction) => {
    switch (transaction.source) {
      case "SIGNUP":
        return personAddOutline
      case "ORDER":
        return restaurantOutline
      case "REFERRAL":
        return personAddOutline
      case "MANUAL":
        return giftOutline
      default:
        return walletOutline
    }
  }

  const getTransactionTypeColor = (transactionType: string) => {
    switch (transactionType) {
      case "EARN":
      case "BONUS":
        return "#4CAF50"
      case "REDEEM":
        return "#FF4444"
      case "EXPIRE":
        return "#FF9800"
      default:
        return COLORS.text
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
    return date.toLocaleDateString("en-US", options)
  }

  const getExpiringCoins = () => {
    if (!loyaltyData) return 0
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return loyaltyData.recentTransactions
      .filter((t) => t.expiresAt && new Date(t.expiresAt) <= thirtyDaysFromNow && new Date(t.expiresAt) > now)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getFilteredTransactions = () => {
    if (!loyaltyData) return []

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    switch (filter) {
      case "expiring_soon":
        return loyaltyData.recentTransactions.filter(
          (t) => t.expiresAt && new Date(t.expiresAt) <= thirtyDaysFromNow && new Date(t.expiresAt) > now,
        )
      case "expired":
        return loyaltyData.recentTransactions.filter((t) => t.expiresAt && new Date(t.expiresAt) <= now)
      default:
        return loyaltyData.recentTransactions
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "BRONZE":
        return medalOutline
      case "SILVER":
        return starOutline
      case "GOLD":
        return trophyOutline
      case "PLATINUM":
        return trophyOutline
      default:
        return medalOutline
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "BRONZE":
        return "#CD7F32"
      case "SILVER":
        return "#C0C0C0"
      case "GOLD":
        return "#FFD700"
      case "PLATINUM":
        return "#E5E4E2"
      default:
        return "#CD7F32"
    }
  }

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleBackClick} fill="clear">
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Ioshii Coins</IonTitle>
          </IonToolbar>
        </IonHeader>
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
            <IonText style={{ marginTop: "16px", color: COLORS.text }}>Loading coins data...</IonText>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  const expiringCoins = getExpiringCoins()

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBackClick} fill="clear">
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Ioshii Coins</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: "20px 16px" }}>
          {/* Balance Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {/* Available Balance */}
            <IonCard
              style={{
                margin: 0,
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              }}
            >
              <IonCardContent style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <IonIcon
                    icon={walletOutline}
                    style={{
                      fontSize: "20px",
                      color: COLORS.text,
                      marginRight: "8px",
                    }}
                  />
                  <IonText
                    style={{
                      fontSize: "14px",
                      color: COLORS.text,
                      fontWeight: "500",
                    }}
                  >
                    Available Balance
                  </IonText>
                </div>
                <IonText>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: COLORS.text,
                    }}
                  >
                    ₹{loyaltyData?.account.currentBalance || 0}
                  </h2>
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Expiring Soon */}
            <IonCard
              style={{
                margin: 0,
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              }}
            >
              <IonCardContent style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <IonIcon
                    icon={timeOutline}
                    style={{
                      fontSize: "20px",
                      color: COLORS.text,
                      marginRight: "8px",
                    }}
                  />
                  <IonText
                    style={{
                      fontSize: "14px",
                      color: COLORS.text,
                      fontWeight: "500",
                    }}
                  >
                    Expiring Soon
                  </IonText>
                </div>
                <IonText>
                  <h2
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#FF4444",
                    }}
                  >
                    ₹{expiringCoins}
                  </h2>
                </IonText>
                <IonText
                  style={{
                    fontSize: "12px",
                    color: "#FF4444",
                  }}
                >
                  in 30 days
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Tier Progress Card */}
          {loyaltyData?.tierProgress && (
            <IonCard
              style={{
                margin: "0 0 24px 0",
                borderRadius: "16px",
                background: `linear-gradient(135deg, ${getTierColor(loyaltyData.tierProgress.currentTier)}20 0%, ${getTierColor(loyaltyData.tierProgress.currentTier)}10 100%)`,
                border: `1px solid ${getTierColor(loyaltyData.tierProgress.currentTier)}40`,
              }}
            >
              <IonCardContent style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IonIcon
                      icon={getTierIcon(loyaltyData.tierProgress.currentTier)}
                      style={{
                        fontSize: "24px",
                        color: getTierColor(loyaltyData.tierProgress.currentTier),
                        marginRight: "8px",
                      }}
                    />
                    <IonText
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: COLORS.text,
                      }}
                    >
                      {loyaltyData.tierProgress.currentTier} Tier
                    </IonText>
                  </div>
                  <IonBadge
                    color="primary"
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    {loyaltyData.tierProgress.progress}% to {loyaltyData.tierProgress.nextTier}
                  </IonBadge>
                </div>
                <IonProgressBar
                  value={loyaltyData.tierProgress.progress / 100}
                  color="primary"
                  style={{ marginBottom: "8px" }}
                />
                <IonText
                  style={{
                    fontSize: "14px",
                    color: COLORS.gray,
                  }}
                >
                  {loyaltyData.tierProgress.coinsNeeded} more coins to reach {loyaltyData.tierProgress.nextTier}
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {/* Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "24px",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            {[
              { key: "all" as CoinsFilter, label: "All" },
              { key: "expiring_soon" as CoinsFilter, label: "Expiring soon" },
              { key: "expired" as CoinsFilter, label: "Expired" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "12px 0",
                  fontSize: "16px",
                  fontWeight: filter === tab.key ? "600" : "400",
                  color: filter === tab.key ? COLORS.primary : COLORS.gray,
                  borderBottom: filter === tab.key ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Referral Card */}
          <IonCard
            style={{
              margin: "0 0 24px 0",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #E3F2FD 0%, #F0F8FF 100%)",
              border: "1px solid #E1F5FE",
            }}
          >
            <IonCardContent style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "20px",
                        backgroundColor: "#FFD700",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      <IonText style={{ fontSize: "20px" }}>₹</IonText>
                    </div>
                    <div>
                      <IonText
                        style={{
                          fontSize: "14px",
                          color: COLORS.text,
                          fontWeight: "500",
                        }}
                      >
                        Earn upto ₹2500
                      </IonText>
                      <IonText>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: COLORS.text,
                          }}
                        >
                          Refer Friends and Earn
                        </h3>
                      </IonText>
                    </div>
                  </div>
                </div>
                <IonButton
                  fill="solid"
                  size="default"
                  onClick={handleReferNow}
                  style={{
                    "--background": "#00BCD4",
                    "--color": "white",
                    "--border-radius": "20px",
                    minWidth: "100px",
                  }}
                >
                  Refer Now
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Redemption Options */}
          {loyaltyData?.redemptionOptions && loyaltyData.redemptionOptions.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <IonText>
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: COLORS.text,
                  }}
                >
                  Redemption Options
                </h3>
              </IonText>
              {loyaltyData.redemptionOptions.map((option) => (
                <IonCard
                  key={option._id}
                  style={{
                    margin: "0 0 12px 0",
                    borderRadius: "12px",
                  }}
                >
                  <IonCardContent style={{ padding: "16px" }}>
                    <IonText>
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "16px",
                          fontWeight: "600",
                          color: COLORS.text,
                        }}
                      >
                        {option.name}
                      </h4>
                    </IonText>
                    <IonText
                      style={{
                        fontSize: "14px",
                        color: COLORS.gray,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      {option.description}
                    </IonText>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <IonChip color="primary">
                        <IonLabel>Min Order: ₹{option.minimumOrderForRedemption}</IonLabel>
                      </IonChip>
                      <IonChip color="success">
                        <IonLabel>1 Coin = ₹{option.discountValue}</IonLabel>
                      </IonChip>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}

          {/* Transaction History */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <IonText>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: COLORS.text,
                }}
              >
                Recent Transactions
              </h3>
            </IonText>
            <IonText
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: COLORS.text,
              }}
            >
              ₹{loyaltyData?.account.currentBalance || 0}
              <IonIcon
                icon={chevronDownOutline}
                style={{
                  fontSize: "16px",
                  marginLeft: "4px",
                }}
              />
            </IonText>
          </div>

          {/* Transactions List */}
          <div>
            {getFilteredTransactions().map((transaction) => (
              <div
                key={transaction._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "24px",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px",
                  }}
                >
                  <IonIcon
                    icon={getTransactionIcon(transaction)}
                    style={{
                      fontSize: "24px",
                      color: COLORS.text,
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <IonText
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: COLORS.text,
                        marginRight: "8px",
                      }}
                    >
                      {transaction.reason}
                    </IonText>
                    {(transaction.transactionType === "EARN" || transaction.transactionType === "BONUS") && (
                      <IonChip
                        style={{
                          "--background": "#E8F5E8",
                          "--color": "#2E7D32",
                          fontSize: "12px",
                          height: "24px",
                        }}
                      >
                        {transaction.transactionType === "BONUS" ? "Bonus" : "Earned"}
                      </IonChip>
                    )}
                  </div>
                  <IonText
                    style={{
                      fontSize: "14px",
                      color: COLORS.gray,
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    {formatDate(transaction.createdAt)}
                  </IonText>
                  {transaction.expiresAt && (
                    <IonText
                      style={{
                        fontSize: "12px",
                        color: "#FF4444",
                      }}
                    >
                      • Expires on {formatDate(transaction.expiresAt)}
                    </IonText>
                  )}
                </div>
                <IonText
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: getTransactionTypeColor(transaction.transactionType),
                  }}
                >
                  {transaction.transactionType === "REDEEM" ? "-" : "+"}₹{transaction.amount}
                </IonText>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {getFilteredTransactions().length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
              }}
            >
              <IonIcon
                icon={walletOutline}
                style={{
                  fontSize: "64px",
                  color: COLORS.gray,
                  marginBottom: "16px",
                }}
              />
              <IonText>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    color: COLORS.text,
                    fontWeight: "600",
                  }}
                >
                  No transactions found
                </h3>
              </IonText>
              <IonText
                style={{
                  fontSize: "14px",
                  color: COLORS.gray,
                }}
              >
                {filter === "all"
                  ? "Start earning coins by placing orders!"
                  : filter === "expiring_soon"
                    ? "No coins expiring in the next 30 days"
                    : "No expired coins found"}
              </IonText>
            </div>
          )}
        </div>

        {/* Toast Messages */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={hideToast}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="top"
        />
      </IonContent>
    </IonPage>
  )
}

export default CoinsPage
