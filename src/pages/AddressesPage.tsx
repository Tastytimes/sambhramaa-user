"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonAlert,
  IonButton,
  IonSpinner,
} from "@ionic/react"
import {
  homeOutline,
  briefcaseOutline,
  peopleOutline,
  locationOutline,
  addOutline,
  arrowBackOutline,
  createOutline,
  trashOutline,
  shareOutline,
} from "ionicons/icons"
import { useHistory } from "react-router-dom"
import { COLORS } from "../theme/theme"
import { addressApi } from "../api/AddressApi"
// import type { Address } from "../constants/addressInterface"
import CustomButton from "../components/CustomButton"
import { Address } from "../constants/addressInterface"
import axios from "axios"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [deleteAlert, setDeleteAlert] = useState<{
    isOpen: boolean
    addressId: string
    addressName: string
  }>({ isOpen: false, addressId: "", addressName: "" })
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const history = useHistory()

  // Ref to track if addresses have been fetched
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    // Skip if already fetched
    if (hasFetchedRef.current && addresses.length > 0) return
    hasFetchedRef.current = true
    fetchAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter addresses when search text changes
  const filterAddresses = useCallback((): void => {
    let filtered = addresses

    if (searchText.trim()) {
      filtered = addresses.filter(
        (address) =>
          address.locationName.toLowerCase().includes(searchText.toLowerCase()) ||
          address.fullAddress.toLowerCase().includes(searchText.toLowerCase()) ||
          address.houseFlatFloorNo.toLowerCase().includes(searchText.toLowerCase()) ||
          address.apartmentRoadArea.toLowerCase().includes(searchText.toLowerCase()),
      )
    }

    setFilteredAddresses(filtered)
  }, [addresses, searchText])

  useEffect(() => {
    filterAddresses()
  }, [filterAddresses])

  const fetchAddresses = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await addressApi.getAllAddress()
      if (Array.isArray(response.data)) {
        setAddresses(response.data)
      } else {
        setAddresses([])
      }
    } catch (error: unknown ) {
      console.error("Error fetching addresses:", error)
      if(axios.isAxiosError(error)) {
        showToast(error.response?.data?.message || "Failed to load addresses. Please try again.", "danger")
      } else {
        const err = error as Error
        showToast(err.message || "Failed to load addresses. Please try again.", "danger")
      }
      setAddresses([])
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  const handleRefresh = async (event: CustomEvent): Promise<void> => {
    setRefreshing(true)
    await fetchAddresses()
    event.detail.complete()
  }

  const getAddressIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case "home":
        return homeOutline
      case "work":
        return briefcaseOutline
      case "friends and family":
      case "friends_family":
        return peopleOutline
      default:
        return locationOutline
    }
  }

  const handleAddNewAddress = (): void => {
    history.push("/select-location?navigationSource=manage-addresses")
  }

  const handleEditAddress = (addressId: string): void => {
    history.push(`/edit-address/${addressId}`)
  }

  const handleDeleteAddress = (addressId: string, addressName: string): void => {
    setDeleteAlert({
      isOpen: true,
      addressId,
      addressName,
    })
  }

  const confirmDeleteAddress = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await addressApi.deleteAddress(deleteAlert.addressId)
      setDeleteAlert({ isOpen: false, addressId: "", addressName: "" })
      fetchAddresses()
      showToast(response.message || "Address deleted successfully", "success")
    } catch (error: unknown) {
        
      console.error("Error deleting address:", error)
      if (axios.isAxiosError(error)) {
        showToast(error.response?.data?.message || "Failed to delete address. Please try again.", "danger")
      } else {
        const err = error as Error
        showToast(err.message || "Failed to delete address. Please try again.", "danger")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleShareAddress = (address: Address): void => {
    const shareText = `${address.houseFlatFloorNo}, ${address.apartmentRoadArea}, ${address.fullAddress}`
    // For web/PWA, use the Web Share API if available, otherwise copy to clipboard
    if (navigator.share) {
      navigator
        .share({
          title: `${address.locationName} Address`,
          text: shareText,
        })
        .catch((err) => console.log("Error sharing:", err))
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          showToast("Address copied to clipboard", "success")
        })
        .catch(() => {
          showToast(`Address: ${shareText}`, "primary")
        })
    }
  }

  const handleBackNavigation = (): void => {
    history.goBack()
  }

  const renderEmptyState = (): React.ReactElement => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        textAlign: "center",
      }}
    >
      <IonIcon
        icon={locationOutline}
        style={{
          fontSize: "80px",
          color: COLORS.gray,
          marginBottom: "24px",
        }}
      />
      <IonText>
        <h2
          style={{
            color: COLORS.text,
            margin: "0 0 12px 0",
            fontWeight: "600",
          }}
        >
          No Saved Addresses
        </h2>
      </IonText>
      <IonText>
        <p
          style={{
            color: COLORS.gray,
            margin: "0 0 24px 0",
            lineHeight: "22px",
          }}
        >
          Add your home, work, and other addresses for faster checkout
        </p>
      </IonText>
      <CustomButton onClick={handleAddNewAddress}>Add First Address</CustomButton>
    </div>
  )

  const renderAddressCard = (address: Address): React.ReactElement => (
    <IonCard key={address.id} style={{ margin: "8px 0", borderRadius: "12px" }}>
      <IonCardContent>
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "12px" }}>
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
              flexShrink: 0,
            }}
          >
            <IonIcon
              icon={getAddressIcon(address.addressType)}
              style={{
                fontSize: "20px",
                color: COLORS.text,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <IonText>
              <h3
                style={{
                  margin: "0 0 4px 0",
                  color: COLORS.text,
                  fontWeight: "600",
                  fontSize: "18px",
                  textTransform: "capitalize",
                }}
              >
                {address.locationName}
              </h3>
            </IonText>
            <IonText
              style={{
                color: COLORS.text,
                fontSize: "14px",
                lineHeight: "20px",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {address.houseFlatFloorNo}, {address.apartmentRoadArea}
            </IonText>
            <IonText
              style={{
                color: COLORS.gray,
                fontSize: "14px",
                lineHeight: "20px",
                display: "block",
              }}
            >
              {address.fullAddress}
            </IonText>
            {address.directionsToReach && (
              <IonText
                style={{
                  color: COLORS.gray,
                  fontSize: "12px",
                  lineHeight: "18px",
                  display: "block",
                  marginTop: "8px",
                  fontStyle: "italic",
                }}
              >
                Directions: {address.directionsToReach}
              </IonText>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: `1px solid ${COLORS.lightGray}`,
          }}
        >
          <IonButton
            fill="clear"
            size="small"
            onClick={() => handleEditAddress(address.id)}
            style={{
              "--color": COLORS.primary,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <IonIcon icon={createOutline} style={{ marginRight: "4px", fontSize: "14px" }} />
            EDIT
          </IonButton>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => handleDeleteAddress(address.id, address.locationName)}
            style={{
              "--color": COLORS.error,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <IonIcon icon={trashOutline} style={{ marginRight: "4px", fontSize: "14px" }} />
            DELETE
          </IonButton>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => handleShareAddress(address)}
            style={{
              "--color": COLORS.gray,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <IonIcon icon={shareOutline} style={{ marginRight: "4px", fontSize: "14px" }} />
            SHARE
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Manage Addresses</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search Bar */}
        <div style={{ padding: "16px" }}>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search your saved addresses..."
            showClearButton="focus"
            style={{
              "--background": COLORS.lightGray,
              "--border-radius": "12px",
              "--box-shadow": "none",
            }}
          />
        </div>

        {loading && !refreshing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <IonSpinner name="crescent" color="primary" style={{ width: "32px", height: "32px" }} />
            <IonText style={{ marginTop: "16px", color: COLORS.gray }}>Loading addresses...</IonText>
          </div>
        ) : addresses.length === 0 ? (
          renderEmptyState()
        ) : (
          <div style={{ padding: "0 16px 100px 16px" }}>
            {/* Saved Addresses Header */}
            <div style={{ marginBottom: "16px", paddingLeft: "4px" }}>
              <IonText>
                <h3
                  style={{
                    margin: "0",
                    color: COLORS.gray,
                    fontWeight: "600",
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Saved Addresses ({filteredAddresses.length})
                </h3>
              </IonText>
            </div>

            {/* Address List */}
            {filteredAddresses.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                }}
              >
                <IonIcon
                  icon={locationOutline}
                  style={{
                    fontSize: "60px",
                    color: COLORS.gray,
                    marginBottom: "16px",
                  }}
                />
                <IonText>
                  <h3
                    style={{
                      color: COLORS.text,
                      margin: "0 0 8px 0",
                      fontWeight: "600",
                    }}
                  >
                    No addresses found
                  </h3>
                </IonText>
                <IonText>
                  <p
                    style={{
                      color: COLORS.gray,
                      margin: 0,
                      fontSize: "14px",
                    }}
                  >
                    Try searching with different keywords
                  </p>
                </IonText>
              </div>
            ) : (
              filteredAddresses.map((address) => renderAddressCard(address))
            )}
          </div>
        )}

        {/* Add Address Button */}
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "16px",
            right: "16px",
            zIndex: 10,
          }}
        >
          <CustomButton fullWidth size="large" onClick={handleAddNewAddress}>
            <IonIcon icon={addOutline} style={{ marginRight: "8px" }} />
            Add New Address
          </CustomButton>
        </div>

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={deleteAlert.isOpen}
          onDidDismiss={() => setDeleteAlert({ isOpen: false, addressId: "", addressName: "" })}
          header="Delete Address"
          message={`Are you sure you want to delete "${deleteAlert.addressName}" address?`}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Delete",
              handler: confirmDeleteAddress,
            },
          ]}
        />

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

export default AddressesPage
