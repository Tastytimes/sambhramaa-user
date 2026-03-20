"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonToast,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react"
import {
  arrowBackOutline,
  locationOutline,
  homeOutline,
  businessOutline,
  addOutline,
  checkmarkOutline,
  navigateOutline,
} from "ionicons/icons"
import { useHistory } from "react-router-dom"
import { useAppSelector } from "../hooks/useAppSelector"
import { useAppDispatch } from "../hooks/useAppDispatch"
import {
  setSelectedAddress,
  getCurrentLocation,
  fetchSavedAddresses,
  clearSelectedAddress,
} from "../store/slices/locationSlice"
import { resetDashboard } from "../store/slices/dashboardSlice"
import type { Address } from "../constants/addressInterface"
import { COLORS } from "../theme/theme"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

const SelectAddressPage: React.FC = () => {
  const history = useHistory()
  const dispatch = useAppDispatch()

  const { currentLocation, selectedAddress, savedAddresses, loading } = useAppSelector((state) => state.location)

  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  useEffect(() => {
    // Fetch saved addresses when component mounts
    dispatch(fetchSavedAddresses())
  }, [dispatch])

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

  const handleBack = () => {
    history.goBack()
  }

  const handleAddressSelect = (address: Address) => {
    dispatch(setSelectedAddress(address))
    dispatch(resetDashboard()) // Reset dashboard to fetch new data for selected location
    showToast("Address selected successfully", "success")
    setTimeout(() => {
      history.push("/dashboard")
    }, 1000)
  }

  const handleCurrentLocationSelect = async () => {
    try {
      await dispatch(getCurrentLocation()).unwrap()
      dispatch(clearSelectedAddress()) // Clear selected address to use current location
      dispatch(resetDashboard())
      showToast("Using current location", "success")
      setTimeout(() => {
        history.push("/dashboard")
      }, 1000)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(error.message, "danger")
      } else {
        showToast("Failed to get current location", "danger")
      }
    }
  }

  const handleAddNewAddress = () => {
    // Navigate to SelectLocationPage first, which will then go to AddAddressPage
    history.push("/select-location?navigationSource=select-address")
  }

  const onRefresh = async (event: CustomEvent) => {
    try {
      await dispatch(fetchSavedAddresses()).unwrap()
      showToast("Addresses refreshed", "success")
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(error.message, "danger")
      } else {
        showToast("Failed to refresh addresses", "danger")
      }
    } finally {
      event.detail.complete()
    }
  }

  const getAddressIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return homeOutline
      case "work":
      case "office":
        return businessOutline
      default:
        return locationOutline
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton fill="clear" slot="start" onClick={handleBack} style={{ marginLeft: "8px" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Select Address</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div style={{ padding: "16px" }}>
          {/* Current Location Option */}
          <div
            style={{
              backgroundColor: COLORS.white,
              borderRadius: "12px",
              marginBottom: "16px",
              border: `1px solid ${COLORS.lightGray}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <IonItem
              button
              onClick={handleCurrentLocationSelect}
              style={{
                "--border-radius": "12px",
                "--background": COLORS.white,
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "20px",
                  backgroundColor: COLORS.primary,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: "12px",
                }}
              >
                <IonIcon icon={navigateOutline} style={{ fontSize: "20px", color: COLORS.white }} />
              </div>
              <IonLabel>
                <h3 style={{ color: COLORS.primary, fontWeight: "600", margin: "0 0 4px 0" }}>Use Current Location</h3>
                <p style={{ color: COLORS.gray, margin: 0, fontSize: "14px" }}>
                  {currentLocation?.address || "Getting your location..."}
                </p>
              </IonLabel>
              {loading && <IonSpinner name="crescent" />}
            </IonItem>
          </div>

          {/* Saved Addresses */}
          <div
            style={{
              backgroundColor: COLORS.white,
              borderRadius: "12px",
              border: `1px solid ${COLORS.lightGray}`,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                padding: "16px",
                borderBottom: `1px solid ${COLORS.lightGray}`,
              }}
            >
              <IonText>
                <h3
                  style={{
                    margin: 0,
                    color: COLORS.text,
                    fontWeight: "600",
                    fontSize: "16px",
                  }}
                >
                  Saved Addresses
                </h3>
              </IonText>
            </div>

            <IonList>
              {savedAddresses.length === 0 ? (
                <div
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                  }}
                >
                  <IonIcon
                    icon={locationOutline}
                    style={{
                      fontSize: "48px",
                      color: COLORS.gray,
                      marginBottom: "16px",
                    }}
                  />
                  <IonText>
                    <p style={{ color: COLORS.gray, margin: 0 }}>No saved addresses yet</p>
                  </IonText>
                  <IonButton
                    fill="outline"
                    onClick={handleAddNewAddress}
                    style={{
                      marginTop: "16px",
                      "--border-color": COLORS.primary,
                      "--color": COLORS.primary,
                    }}
                  >
                    <IonIcon icon={addOutline} slot="start" />
                    Add Address
                  </IonButton>
                </div>
              ) : (
                savedAddresses.map((address) => (
                  <IonItem
                    key={address.id}
                    button
                    onClick={() => handleAddressSelect(address)}
                    style={{
                      "--background": COLORS.white,
                      ...(selectedAddress?.id === address.id
                        ? {
                            "--border-width": "2px",
                            "--border-style": "solid",
                            "--border-color": COLORS.primary,
                          }
                        : {}),
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "20px",
                        backgroundColor: selectedAddress?.id === address.id ? COLORS.primary + "20" : COLORS.lightGray,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: "12px",
                      }}
                    >
                      <IonIcon
                        icon={getAddressIcon(address.addressType)}
                        style={{
                          fontSize: "20px",
                          color: selectedAddress?.id === address.id ? COLORS.primary : COLORS.text,
                        }}
                      />
                    </div>
                    <IonLabel>
                      <h3
                        style={{
                          color: selectedAddress?.id === address.id ? COLORS.primary : COLORS.text,
                          fontWeight: "600",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {address.locationName}
                      </h3>
                      <p
                        style={{
                          color: COLORS.gray,
                          margin: "0 0 4px 0",
                          fontSize: "14px",
                          textTransform: "capitalize",
                        }}
                      >
                        {address.addressType}
                      </p>
                      <p
                        style={{
                          color: COLORS.gray,
                          margin: 0,
                          fontSize: "12px",
                          lineHeight: "1.4",
                        }}
                      >
                        {address.fullAddress || address.apartmentRoadArea}
                      </p>
                    </IonLabel>
                    {selectedAddress?.id === address.id && (
                      <IonIcon icon={checkmarkOutline} style={{ fontSize: "20px", color: COLORS.primary }} slot="end" />
                    )}
                  </IonItem>
                ))
              )}
            </IonList>
          </div>
        </div>

        {/* Add New Address FAB */}
        {savedAddresses.length > 0 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleAddNewAddress} color="primary">
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Toast Messages */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={hideToast}
          message={toast.message}
          duration={2000}
          color={toast.color}
          position="top"
        />
      </IonContent>
    </IonPage>
  )
}

export default SelectAddressPage
