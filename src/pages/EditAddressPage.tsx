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
  IonSpinner,
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
import { useHistory, useParams, useLocation } from "react-router-dom"
import { COLORS } from "../theme/theme"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"
import { addressApi } from "../api/AddressApi"
import { Address, AddressType } from "../constants/addressInterface"
import { AxiosError } from "axios"
// import { AddressLocation } from "../constants/interface"
// Update the import to use AddressLocation
// import type { UpdateAddressPayload, AddressType, AddressLocation } from "../constants/addressInterface"

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

const EditAddressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const history = useHistory()
  const searchParams = new URLSearchParams(location.search)
  const newLatitude = searchParams.get("newLatitude")
  const newLongitude = searchParams.get("newLongitude")
  const newAddress = searchParams.get("newAddress")

  const [formData, setFormData] = useState({
    houseNumber: "",
    apartmentRoad: "",
    directions: "",
    addressType: "" as AddressType,
    customName: "",
    phoneNumber: "", // Add phoneNumber field
  })

  const [address, setAddress] = useState<{
    formattedAddress: string
    latitude: number
    longitude: number
  } | null>(null)

  const [characterCount, setCharacterCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCustomNameModal, setShowCustomNameModal] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean
    message: string
  }>({ isOpen: false, message: "" })

  useEffect(() => {
    if (id) {
      fetchData(id)
    }
  }, [id])

  useEffect(() => {
    if (newLatitude && newLongitude && newAddress) {
      console.log("Received new location data:", {
        newLatitude,
        newLongitude,
        newAddress,
      })
      setAddress({
        formattedAddress: decodeURIComponent(newAddress),
        latitude: Number.parseFloat(newLatitude),
        longitude: Number.parseFloat(newLongitude),
      })
    }
  }, [newLatitude, newLongitude, newAddress])

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

  const fetchData = async (addressId: string): Promise<void> => {
    try {
      setLoading(true)
      const response = await addressApi.getAddressById(addressId)
      const addressData = response.data as Address

      console.log("Fetched address data:", addressData)

      if (!(newLatitude && newLongitude && newAddress)) {
        setAddress({
          formattedAddress: addressData.fullAddress || "",
          latitude: addressData.location?.coordinates[1] || 0,
          longitude: addressData.location?.coordinates[0] || 0,
        })
      }

      // Convert backend address type
      const addressType = addressData.addressType as AddressType
      let customName = ""

      if (addressType === "other" && addressData.locationName && addressData.locationName.toLowerCase() !== "other") {
        customName = addressData.locationName
      }

      setFormData({
        houseNumber: addressData.houseFlatFloorNo || "",
        apartmentRoad: addressData.apartmentRoadArea || "",
        directions: addressData.directionsToReach || "",
        addressType: addressType,
        customName: customName,
        phoneNumber: "", // phoneNumber not available in Address, set as empty string
      })

      setCharacterCount(addressData.directionsToReach?.length || 0)
    } catch (error: unknown) {
      console.error("Error fetching address:", error)
      if(error instanceof AxiosError) {
        const customError = error as CustomError
        const errorMessage = customError.response?.data?.message || "Failed to load address details"
        showToast(errorMessage, "danger")
      } else if (error instanceof Error) {
        showToast(error.message || "Failed to load address details", "danger")
      }
      showToast("Failed to load address details. Please try again.", "danger")
    } finally {
      setLoading(false)
    }
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

  const handleChangeAddress = (): void => {
    if (address) {
      history.push({
        pathname: "/select-location",
        search: `?fromScreen=edit-address&initialLatitude=${address.latitude}&initialLongitude=${address.longitude}&addressId=${id}`,
      })
    }
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

  const navigate = useHistory().push

  // Update the handleUpdateAddress function
  const handleUpdateAddress = async (): Promise<void> => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Always provide a string for locationName
      const locationName =
        formData.addressType === "other"
          ? (formData.customName && formData.customName.trim()) || "Other"
          : (formData.addressType ? formData.addressType.toUpperCase() : "Other");

      // AddressRequestPayload expects locationName as string (not undefined)
      const payload = {
        locationName,
        fullAddress: address?.formattedAddress || "",
        houseFlatFloorNo: formData.houseNumber,
        apartmentRoadArea: formData.apartmentRoad,
        location: {
          type: "Point",
          coordinates: [
            typeof address?.longitude === "number" ? address.longitude : 0,
            typeof address?.latitude === "number" ? address.latitude : 0,
          ] as [number, number],
        },
        directionsToReach: formData.directions || undefined,
        addressType: formData.addressType,
        phoneNumber: formData.phoneNumber || undefined,
      };

      await addressApi.updateAddress(id, payload);
      showToast("Address updated successfully", "success")
      setTimeout(() => {
        navigate("/addresses")
      }, 1500)
    } catch (error: unknown) {
      console.error("Error updating address:", error)

      let errorMessage = "Failed to update address. Please try again."
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
    history.goBack()
  }

  if (loading && !address) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
            <IonTitle>Edit Address</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "40px",
            }}
          >
            <IonSpinner name="crescent" color="primary" style={{ width: "32px", height: "32px" }} />
            <IonText style={{ marginTop: "16px", color: COLORS.gray }}>Loading address details...</IonText>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Edit Address</IonTitle>
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
          {/* Address Display with Change Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: COLORS.lightGray,
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "8px",
            }}
          >
            <IonText
              style={{
                color: COLORS.text,
                fontSize: "14px",
                lineHeight: "20px",
                flex: 1,
                marginRight: "10px",
              }}
            >
              {address?.formattedAddress}
            </IonText>
            <IonButton
              fill="outline"
              size="small"
              onClick={handleChangeAddress}
              style={{
                "--border-color": COLORS.primary,
                "--color": COLORS.primary,
                height: "32px",
              }}
            >
              CHANGE
            </IonButton>
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

            <CustomInput
              label="Phone Number (Optional)"
              type="text"
              value={formData.phoneNumber}
              onIonInput={(e) => handleInputChange("phoneNumber", e.detail.value!)}
              placeholder="Enter phone number"
            />
            <CustomButton fullWidth size="large" onClick={handleUpdateAddress} loading={loading} disabled={loading}>
              {loading ? "Updating..." : "Update Address"}
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

export default EditAddressPage
