"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import {
  IonContent,
  IonText,
  IonIcon,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonToast,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonInput,
  IonAlert,
} from "@ionic/react"
import {
  logOutOutline,
  closeOutline,
  chevronForwardOutline,
  locationOutline,
  lockClosedOutline,
  timeOutline,
  heartOutline,
  notificationsOutline,
  helpCircleOutline,
  informationCircleOutline,
  diamondOutline,
} from "ionicons/icons"
import { useAppDispatch } from "../hooks/useAppDispatch"
import { clearError, setUser, updateUser } from "../store/slices/authSlice"
import { COLORS } from "../theme/theme"
import { authApi } from "../api/AuthApi"
import CustomButton from "../components/CustomButton"
import { useAppSelector } from "../hooks/useAppSelector"
import { useHistory } from "react-router-dom"
import { removeItem, getItem, setItem } from "../utills/storage"
// import { removeItem } from "../utils/storage"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

interface MenuItem {
  id: string
  title: string
  icon: string
  onPress: () => void
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

const AccountPage: React.FC = () => {
  const { user, loading, error } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()

  // Edit profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutAlert, setLogoutAlert] = useState(false)
  const history = useHistory()

  // Track if profile form has been initialized
  const hasInitializedFormRef = useRef(false)

  const showToast = (message: string, color: ToastState["color"] = "primary"): void => {
    setToast({
      isOpen: true,
      message,
      color,
    })
  }

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

  useEffect(() => {
    // Only initialize form values once or when user data actually changes
    if (user && !hasInitializedFormRef.current) {
      hasInitializedFormRef.current = true
      setName(user.name)
      setEmail(user.email)
      setPhoneNumber(user.phoneNumber)
    }
  }, [user])

  const hideToast = (): void => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }

  const menuItems: MenuItem[] = [
    {
      id: "1",
      title: "Manage Addresses",
      icon: locationOutline,
      onPress: () => {
        history.push("/addresses")
      },
    },
    {
      id: "2",
      title: "Change Password",
      icon: lockClosedOutline,
      onPress: () => {
        history.push("/change-password")
      },
    },
    {
      id: "3",
      title: "Order History",
      icon: timeOutline,
      onPress: () => {
        history.push("/orders-history")
      },
    },
    {
      id: "4",
      title: "Favorites",
      icon: heartOutline,
      onPress: () => {
        history.push("/favorites")
      },
    },
    {
      id: "5",
      title: "Ioshii Coins",
      icon: diamondOutline,
      onPress: () => {
        history.push("/coins")
      },
    },
    {
      id: "6",
      title: "Notifications",
      icon: notificationsOutline,
      onPress: () => {
        // Navigate to notifications
      },
    },
    {
      id: "7",
      title: "Help & Support",
      icon: helpCircleOutline,
      onPress: () => {
        // Navigate to help & support
      },
    },
    {
      id: "8",
      title: "About Us",
      icon: informationCircleOutline,
      onPress: () => {
        // Navigate to about us
      },
    },
  ]

  const handleUpdateProfile = async (): Promise<void> => {
    setUpdateLoading(true)
    try {
      const response = await authApi.updateProfile({ name, email, phoneNumber })
      if (response.data) {
        showToast(response.data.message || "Profile updated successfully!", "success")
        // Update Redux state if user exists
        if (user) {
          const updatedUser = {
            ...user,
            name,
            email,
            phoneNumber,
          }
          dispatch(updateUser(updatedUser))
          // Also save to localStorage
          await setItem("userData", JSON.stringify(updatedUser))
        }
        setEditModalVisible(false)
      }
    } catch (error: unknown) {
      console.error("Update profile failed:", error)
      let errorMessage = "Failed to update profile. Please try again."
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const customError = error as CustomError
        errorMessage = customError.response?.data?.message || customError.message || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }
      showToast(errorMessage, "danger")
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleLogoutConfirm = async (): Promise<void> => {
    setLogoutLoading(true)
    try {
      // Call the logout API
      const response = await authApi.logout()
      // Clear local storage regardless of API response
      await removeItem("userToken")
      await removeItem("userData")
      // Dispatch logout action to clear Redux state
      dispatch(setUser(null))
      // Show success message
      showToast(response.data?.message ?? "Logged out successfully", "success")
      // Navigate to login page after a short delay
      setTimeout(() => {
        history.replace("/login")
      }, 1000)
    } catch (error: unknown) {
      console.error("Logout failed:", error)
      // Even if API fails, still clear local data and logout
      await removeItem("userToken")
      await removeItem("userData")
      dispatch(setUser(null))
      showToast("Logged out successfully", "success")
      setTimeout(() => {
        history.replace("/login")
      }, 1000)
    } finally {
      setLogoutLoading(false)
      setLogoutAlert(false)
    }
  }

  const handleLogout = (): void => {
    setLogoutAlert(true)
  }

  return (
    <>
      <IonContent fullscreen>
        <div style={{ padding: "16px" }}>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <IonText>
              <h1
                style={{
                  color: COLORS.text,
                  margin: "0",
                  fontWeight: "bold",
                  fontSize: "32px",
                }}
              >
                Profile
              </h1>
            </IonText>
          </div>
          {/* Profile Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            {/* Profile Circle */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "40px",
                backgroundColor: COLORS.primary,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "16px",
              }}
            >
              <IonText
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: COLORS.white,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </IonText>
            </div>
            {/* Profile Info */}
            <div style={{ flex: 1 }}>
              <IonText>
                <h3
                  style={{
                    margin: "0 0 4px 0",
                    color: COLORS.text,
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  {user?.name || "User"}
                </h3>
              </IonText>
              <IonText style={{ color: COLORS.gray, fontSize: "16px" }}>{user?.email || "No email provided"}</IonText>
              <IonText
                color="primary"
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginTop: "8px",
                  display: "block",
                }}
                onClick={() => setEditModalVisible(true)}
              >
                Edit Profile
              </IonText>
            </div>
          </div>
          {/* Stats Container */}
          <IonCard style={{ margin: "0 0 24px 0" }}>
            <IonCardContent>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                }}
              >
                <div style={{ textAlign: "center", flex: 1 }}>
                  <IonText>
                    <h2
                      style={{
                        margin: "0 0 4px 0",
                        color: COLORS.primary,
                        fontWeight: "bold",
                      }}
                    >
                      12
                    </h2>
                  </IonText>
                  <IonText style={{ color: COLORS.gray, fontSize: "12px" }}>Orders</IonText>
                </div>
                <div
                  style={{
                    width: "1px",
                    height: "40px",
                    backgroundColor: COLORS.lightGray,
                  }}
                />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <IonText>
                    <h2
                      style={{
                        margin: "0 0 4px 0",
                        color: COLORS.primary,
                        fontWeight: "bold",
                      }}
                    >
                      4
                    </h2>
                  </IonText>
                  <IonText style={{ color: COLORS.gray, fontSize: "12px" }}>Favorites</IonText>
                </div>
                <div
                  style={{
                    width: "1px",
                    height: "40px",
                    backgroundColor: COLORS.lightGray,
                  }}
                />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <IonText>
                    <h2
                      style={{
                        margin: "0 0 4px 0",
                        color: COLORS.primary,
                        fontWeight: "bold",
                      }}
                    >
                      2
                    </h2>
                  </IonText>
                  <IonText style={{ color: COLORS.gray, fontSize: "12px" }}>Addresses</IonText>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
          {/* Menu Items */}
          <IonCard style={{ margin: "0 0 16px 0" }}>
            <IonCardContent style={{ padding: "16px" }}>
              {menuItems.map((item, index) => (
                <div key={item.id}>
                  <IonItem button detail={false} onClick={item.onPress} lines="none" style={{ "--padding-start": "0px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "20px",
                        backgroundColor: COLORS.lightGray,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: "12px",
                      }}
                    >
                      <IonIcon icon={item.icon} style={{ fontSize: "20px", color: COLORS.text }} />
                    </div>
                    <IonLabel>
                      <IonText style={{ color: COLORS.text, fontWeight: "500" }}>{item.title}</IonText>
                    </IonLabel>
                    <IonIcon icon={chevronForwardOutline} slot="end" style={{ color: COLORS.gray }} />
                  </IonItem>
                  {index < menuItems.length - 1 && (
                    <div
                      style={{
                        height: "1px",
                        backgroundColor: COLORS.lightGray,
                        margin: "8px 0",
                      }}
                    />
                  )}
                </div>
              ))}
            </IonCardContent>
          </IonCard>
          {/* Logout Button */}
          <IonCard style={{ margin: "0 0 24px 0" }}>
            <IonCardContent>
              <IonItem
                button
                onClick={handleLogout}
                disabled={loading || logoutLoading}
                lines="none"
                style={{ "--padding-start": "0px" }}
              >
                <IonIcon icon={logOutOutline} slot="start" color="danger" style={{ marginRight: "8px" }} />
                <IonLabel color="danger">{logoutLoading ? "Logging out..." : "Logout"}</IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
          {/* Logo Container */}
          <div
            style={{
              textAlign: "center",
              marginTop: "24px",
              marginBottom: "40px",
            }}
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d8842fc7-3aaf-47cb-972b-b4cffdae4c0f.JPG-zCasf11zxlE9rgP6am1PcMTHMbSCRy.jpeg"
              alt="Logo"
              style={{
                width: "120px",
                height: "60px",
                objectFit: "contain",
                marginBottom: "8px",
              }}
            />
            <IonText style={{ color: COLORS.gray, fontSize: "12px" }}>Version 1.0.0</IonText>
          </div>
        </div>
      </IonContent>
      {/* Edit Profile Modal */}
      <IonModal isOpen={editModalVisible} onDidDismiss={() => setEditModalVisible(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Profile</IonTitle>
            <IonButton fill="clear" slot="end" onClick={() => setEditModalVisible(false)}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            {/* Full Name */}
            <div style={{ marginBottom: "16px" }}>
              <IonText>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    color: COLORS.text,
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Full Name
                </p>
              </IonText>
              <IonItem
                style={{
                  "--border-radius": "8px",
                  "--border-width": "1px",
                  "--border-style": "solid",
                  "--border-color": "#e0e0e0",
                }}
              >
                <IonInput
                  value={name}
                  onIonInput={(e) => setName(e.detail.value!)}
                  placeholder="Enter your full name"
                />
              </IonItem>
            </div>
            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <IonText>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    color: COLORS.text,
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Email
                </p>
              </IonText>
              <IonItem
                style={{
                  "--border-radius": "8px",
                  "--border-width": "1px",
                  "--border-style": "solid",
                  "--border-color": "#e0e0e0",
                }}
              >
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                  placeholder="Enter your email"
                />
              </IonItem>
            </div>
            {/* Phone Number */}
            <div style={{ marginBottom: "24px" }}>
              <IonText>
                <p
                  style={{
                    margin: "0 0 8px 0",
                    color: COLORS.text,
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Phone Number
                </p>
              </IonText>
              <IonItem
                style={{
                  "--border-radius": "8px",
                  "--border-width": "1px",
                  "--border-style": "solid",
                  "--border-color": "#e0e0e0",
                }}
              >
                <IonInput
                  type="tel"
                  value={phoneNumber}
                  onIonInput={(e) => {
                    const value = e.detail.value!.replace(/[^0-9]/g, "")
                    if (value.length <= 10) {
                      setPhoneNumber(value)
                    }
                  }}
                  placeholder="Enter your phone number"
                  maxlength={10}
                />
              </IonItem>
            </div>
            {/* Modal Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <CustomButton
                variant="outline"
                fullWidth
                onClick={() => setEditModalVisible(false)}
                disabled={updateLoading}
              >
                Cancel
              </CustomButton>
              <CustomButton fullWidth onClick={handleUpdateProfile} loading={updateLoading} disabled={updateLoading}>
                {updateLoading ? "Saving..." : "Save"}
              </CustomButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
      <IonAlert
        isOpen={logoutAlert}
        onDidDismiss={() => setLogoutAlert(false)}
        header="Confirm Logout"
        message="Are you sure you want to logout from your account?"
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
          },
          {
            text: "Logout",
            handler: handleLogoutConfirm,
            cssClass: "danger",
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
        position="bottom"
        buttons={[
          {
            text: "Dismiss",
            role: "cancel",
          },
        ]}
      />
      {/* Redux Error Toast */}
      <IonToast
        isOpen={!!error}
        onDidDismiss={() => dispatch(clearError())}
        message={error || ""}
        duration={3000}
        color="danger"
        position="top"
      />
    </>
  )
}

export default AccountPage
