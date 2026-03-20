"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonIcon,
  IonButton,
  IonToast,
  IonModal,
  IonItem,
  IonLabel,
  IonTextarea,
  IonAlert,
} from "@ionic/react"
import {
  arrowBackOutline,
  informationCircleOutline,
  homeOutline,
  briefcaseOutline,
  peopleOutline,
  locationOutline,
  closeOutline,
} from "ionicons/icons"
import {  useHistory, useLocation } from "react-router-dom"
import { COLORS } from "../theme/theme"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"
import { addressApi } from "../api/AddressApi"
import { AddressType } from "../constants/addressInterface"
import { AddressLocation, AddressRequestPayload } from "../constants/interface"
// import type { AddressRequestPayload, AddressType, AddressLocation } from "../constants/addressInterface"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

interface CustomError extends Error {
  isAxiosError?: boolean
  originalError?: Error
  response?: {
    data?: {
      message?: string
    }
  }
}

const AddAddressPage: React.FC = () => {
  const location = useLocation()
  const navigate = useHistory()
  const searchParams = new URLSearchParams(location.search)
  const latitude = searchParams.get("latitude")
  const longitude = searchParams.get("longitude")
  const address = searchParams.get("address")
  const navigationSource = searchParams.get("navigationSource")

  const [formData, setFormData] = useState({
    houseNumber: "",
    apartmentRoad: "",
    directions: "",
    addressType: "" as AddressType,
    customName: "",
  })

  const [characterCount, setCharacterCount] = useState(0)
  const [showCustomNameModal, setShowCustomNameModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })
  const [validationAlert, setValidationAlert] = useState({
    isOpen: false,
    message: "",
  })

  useEffect(() => {
    console.log("AddAddress - Navigation source:", navigationSource)
  }, [navigationSource])

  useEffect(() => {
    if (address) {
      const addressParts = (address as string).split(",")
      if (addressParts.length > 1) {
        // Could parse address components here if needed
      }
    }
  }, [address])

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

  const handleInputChange = (field: string, value: string): void => {
    setFormData({
      ...formData,
      [field]: value,
    })
    if (field === "directions") {
      setCharacterCount(value.length)
    }
  }

  const handleAddressTypeSelect = (type: AddressType): void => {
    setFormData({
      ...formData,
      addressType: type,
    })
    if (type === "other") {
      setShowCustomNameModal(true)
    }
  }

  const handleCustomNameSubmit = (): void => {
    if (!formData.customName.trim()) {
      setValidationAlert({
        isOpen: true,
        message: "Please enter a name for this address",
      })
      return
    }
    setShowCustomNameModal(false)
  }

  const validateForm = (): boolean => {
    if (!formData.houseNumber.trim()) {
      setValidationAlert({
        isOpen: true,
        message: "Please enter house/flat/floor number",
      })
      return false
    }
    if (!formData.apartmentRoad.trim()) {
      setValidationAlert({
        isOpen: true,
        message: "Please enter apartment/road/area",
      })
      return false
    }
    if (!formData.addressType) {
      setValidationAlert({
        isOpen: true,
        message: "Please select an address type",
      })
      return false
    }
    if (formData.addressType === "other" && !formData.customName.trim()) {
      setShowCustomNameModal(true)
      return false
    }
    return true
  }

  const getAddressTypeForAPI = (type: AddressType): string => {
    switch (type) {
      case "home":
        return "home"
      case "work":
        return "work"
      case "friends_family":
        return "friends and family"
      case "other":
        return "other"
      default:
        return "home"
    }
  }

  const handleSaveAddress = async (): Promise<void> => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const payload: AddressRequestPayload = {
        locationName: formData.addressType === "other" ? formData.customName : formData.addressType.toUpperCase(),
        fullAddress: address as string,
        houseFlatFloorNo: formData.houseNumber,
        apartmentRoadArea: formData.apartmentRoad,
        location: {
          type: "Point",
          coordinates: [Number.parseFloat(longitude as string), Number.parseFloat(latitude as string)],
        } as AddressLocation,
        directionsToReach: formData.directions || undefined,
        addressType: getAddressTypeForAPI(formData.addressType),
      }

      console.log("Sending address payload:", payload)
      const response = await addressApi.addAddress(payload)

      const navigateBack = (): void => {
        const source = navigationSource as string
        console.log("Navigating back to:", source)
        if (source === "select-address") {
          navigate.push("/select-address")
        } else {
          navigate.push("/addresses")
        }
      }

      showToast(response.message || "Address added successfully", "success")
      setTimeout(() => {
        navigateBack()
      }, 1500)
    } catch (error: unknown) {
      console.error("Error saving address:", error)

      let errorMessage = "Failed to save address. Please try again."
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const customError = error as CustomError
        errorMessage = customError.response?.data?.message || customError.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }

      showToast(errorMessage, "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleBackNavigation = (): void => {
    navigate.goBack()
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>{address ? address.toString().substring(0, 20) + "..." : "Add Address"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          {/* Address Display */}
          <div
            style={{
              backgroundColor: COLORS.lightGray,
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <IonText
              style={{
                color: COLORS.text,
                fontSize: "14px",
                lineHeight: "20px",
              }}
            >
              {address}
            </IonText>
          </div>

          {/* Info Container */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: COLORS.primary + "10",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <IonIcon
              icon={informationCircleOutline}
              style={{
                fontSize: "20px",
                color: COLORS.primary,
                marginRight: "12px",
                flexShrink: 0,
              }}
            />
            <IonText
              style={{
                color: COLORS.primary,
                fontSize: "14px",
                lineHeight: "20px",
                flex: 1,
              }}
            >
              A detailed address will help our Delivery Partner reach your doorstep easily
            </IonText>
          </div>

          {/* Form */}
          <div>
            <CustomInput
              label="House / Flat / Floor No."
              type="text"
              value={formData.houseNumber}
              onIonInput={(e) => handleInputChange("houseNumber", e.detail.value!)}
              placeholder="Enter house/flat/floor number"
              required
            />

            <CustomInput
              label="Apartment / Road / Area (Recommended)"
              type="text"
              value={formData.apartmentRoad}
              onIonInput={(e) => handleInputChange("apartmentRoad", e.detail.value!)}
              placeholder="Enter apartment/road/area"
              required
            />

            {/* Directions */}
            <div style={{ marginBottom: "24px" }}>
              <IonItem
                style={{
                  "--border-radius": "8px",
                  "--border-width": "1px",
                  "--border-style": "solid",
                  "--border-color": "#e0e0e0",
                  marginBottom: "4px",
                }}
              >
                <IonLabel position="stacked" style={{ color: COLORS.text }}>
                  Directions to Reach (Optional)
                </IonLabel>
                <IonTextarea
                  value={formData.directions}
                  onIonInput={(e) => handleInputChange("directions", e.detail.value!)}
                  placeholder="e.g. Ring the bell on the red gate"
                  maxlength={200}
                  rows={3}
                />
              </IonItem>
              <IonText style={{ fontSize: "12px", color: COLORS.gray, float: "right" }}>{characterCount}/200</IonText>
            </div>

            {/* Address Type Selection */}
            <div style={{ marginBottom: "32px" }}>
              <IonText>
                <h3
                  style={{
                    color: COLORS.gray,
                    fontSize: "14px",
                    fontWeight: "600",
                    margin: "0 0 16px 0",
                    textTransform: "uppercase",
                  }}
                >
                  Save As
                </h3>
              </IonText>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <IonButton
                  fill={formData.addressType === "home" ? "solid" : "outline"}
                  size="default"
                  onClick={() => handleAddressTypeSelect("home")}
                  style={{
                    "--border-radius": "25px",
                    height: "50px",
                  }}
                >
                  <IonIcon icon={homeOutline} style={{ marginRight: "8px" }} />
                  Home
                </IonButton>

                <IonButton
                  fill={formData.addressType === "work" ? "solid" : "outline"}
                  size="default"
                  onClick={() => handleAddressTypeSelect("work")}
                  style={{
                    "--border-radius": "25px",
                    height: "50px",
                  }}
                >
                  <IonIcon icon={briefcaseOutline} style={{ marginRight: "8px" }} />
                  Work
                </IonButton>

                <IonButton
                  fill={formData.addressType === "friends_family" ? "solid" : "outline"}
                  size="default"
                  onClick={() => handleAddressTypeSelect("friends_family")}
                  style={{
                    "--border-radius": "25px",
                    height: "50px",
                    gridColumn: "1 / -1",
                  }}
                >
                  <IonIcon icon={peopleOutline} style={{ marginRight: "8px" }} />
                  Friends and Family
                </IonButton>

                <IonButton
                  fill={formData.addressType === "other" ? "solid" : "outline"}
                  size="default"
                  onClick={() => handleAddressTypeSelect("other")}
                  style={{
                    "--border-radius": "25px",
                    height: "50px",
                    gridColumn: "1 / -1",
                  }}
                >
                  <IonIcon icon={locationOutline} style={{ marginRight: "8px" }} />
                  {formData.addressType === "other" && formData.customName ? formData.customName : "Other"}
                </IonButton>
              </div>
            </div>

            <CustomButton fullWidth size="large" onClick={handleSaveAddress} loading={loading} disabled={loading}>
              {loading ? "Saving..." : "Save Address Details"}
            </CustomButton>
          </div>
        </div>

        {/* Custom Name Modal */}
        <IonModal isOpen={showCustomNameModal} onDidDismiss={() => setShowCustomNameModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Enter Address Name</IonTitle>
              <IonButton fill="clear" slot="end" onClick={() => setShowCustomNameModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ maxWidth: "400px", margin: "0 auto" }}>
              <IonText>
                <p
                  style={{
                    color: COLORS.text,
                    marginBottom: "16px",
                    lineHeight: "22px",
                  }}
                >
                  Enter a name for this address
                </p>
              </IonText>

              <CustomInput
                label="Address Name"
                type="text"
                value={formData.customName}
                onIonInput={(e) => handleInputChange("customName", e.detail.value!)}
                placeholder="e.g. Mom's House, Gym, etc."
                required
              />

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <CustomButton
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    if (!formData.customName.trim()) {
                      setFormData({
                        ...formData,
                        addressType: "" as AddressType,
                      })
                    }
                    setShowCustomNameModal(false)
                  }}
                >
                  Cancel
                </CustomButton>
                <CustomButton fullWidth onClick={handleCustomNameSubmit}>
                  Save
                </CustomButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Validation Alert */}
        <IonAlert
          isOpen={validationAlert.isOpen}
          onDidDismiss={() => setValidationAlert({ isOpen: false, message: "" })}
          header="Validation Error"
          message={validationAlert.message}
          buttons={["OK"]}
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

export default AddAddressPage
