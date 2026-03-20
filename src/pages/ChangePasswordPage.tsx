"use client"

import type React from "react"
import { useState } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonIcon,
  IonToast,
  IonButton,
} from "@ionic/react"
import { lockClosedOutline, arrowBackOutline, eyeOutline, eyeOffOutline } from "ionicons/icons"
import { useHistory } from "react-router-dom"
// import { useAppDispatch, useAppSelector } from "../hooks/useAppSelector"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"
import { COLORS } from "../theme/theme"
import type { ISetPassword } from "../constants/interface"
import { authApi } from "../api/AuthApi"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

interface FormErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
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

const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [secureCurrentPassword, setSecureCurrentPassword] = useState(true)
  const [secureNewPassword, setSecureNewPassword] = useState(true)
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const history = useHistory()
//   const dispatch = useAppDispatch()
//   const { user } = useAppSelector((state) => state.auth)

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    // Current password validation
    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required"
      isValid = false
    }

    // New password validation
    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required"
      isValid = false
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
      isValid = false
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number"
      isValid = false
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password"
      isValid = false
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      isValid = false
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      newErrors.newPassword = "New password must be different from current password"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleChangePassword = async (e?: React.FormEvent): Promise<void> => {
    if (e) {
      e.preventDefault()
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({}) // Clear previous errors

    try {
      const payload: ISetPassword = {
        newPassword: newPassword.trim(),
        confirmNewPassword: confirmPassword.trim(),
        currentPassword: currentPassword.trim(),
      }
       

      const response = await authApi.updatePassword(payload)

      if (response.data) {
        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setErrors({})

        // Show success message
        showToast(response.data.message || "Your password has been changed successfully!", "success")

        // Navigate back after a short delay
        setTimeout(() => {
          history.goBack()
        }, 2000)
      } else {
        showToast(response.data.message || "Failed to change password. Please try again.", "danger")
      }
    } catch (error: unknown) {
      console.error("Change password failed:", error)

      let errorMessage = "Failed to change password. Please try again."

      // Check if it's our preserved AxiosError
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const customError = error as CustomError
        if (customError.isAxiosError || customError.originalError) {
          const axiosError = customError.originalError || customError
          console.log("This is an Axios error:", axiosError)

          // Access response data
          errorMessage = (axiosError as CustomError).response?.data?.message || customError.message || errorMessage
        }
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

  const clearError = (field: keyof FormErrors): void => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Change Password</IonTitle>
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
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <IonIcon
              icon={lockClosedOutline}
              style={{
                fontSize: "60px",
                color: COLORS.primary,
                marginBottom: "16px",
              }}
            />
            <IonText>
              <h2
                style={{
                  color: COLORS.text,
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                }}
              >
                Change Password
              </h2>
            </IonText>
            <IonText>
              <p
                style={{
                  color: COLORS.gray,
                  margin: 0,
                  fontSize: "16px",
                  lineHeight: "22px",
                }}
              >
                Update your password to keep your account secure
              </p>
            </IonText>
          </div>

          {/* Change Password Form - Wrapped in proper form element */}
          <form onSubmit={handleChangePassword} noValidate>
            {/* Current Password */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <CustomInput
                label="Current Password"
                type={secureCurrentPassword ? "password" : "text"}
                value={currentPassword}
                onIonInput={(e) => {
                  setCurrentPassword(e.detail.value!)
                  clearError("currentPassword")
                }}
                error={errors.currentPassword}
                placeholder="Enter your current password"
                icon={lockClosedOutline}
                required
              />
              <IonButton
                type="button"
                fill="clear"
                size="small"
                onClick={() => setSecureCurrentPassword(!secureCurrentPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "8px",
                  zIndex: 10,
                  "--color": COLORS.gray,
                }}
                disabled={loading}
              >
                <IonIcon icon={secureCurrentPassword ? eyeOutline : eyeOffOutline} />
              </IonButton>
            </div>

            {/* New Password */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <CustomInput
                label="New Password"
                type={secureNewPassword ? "password" : "text"}
                value={newPassword}
                onIonInput={(e) => {
                  setNewPassword(e.detail.value!)
                  clearError("newPassword")
                }}
                error={errors.newPassword}
                placeholder="Enter your new password"
                icon={lockClosedOutline}
                required
              />
              <IonButton
                type="button"
                fill="clear"
                size="small"
                onClick={() => setSecureNewPassword(!secureNewPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "8px",
                  zIndex: 10,
                  "--color": COLORS.gray,
                }}
                disabled={loading}
              >
                <IonIcon icon={secureNewPassword ? eyeOutline : eyeOffOutline} />
              </IonButton>
            </div>

            {/* Password Requirements */}
            <div
              style={{
                padding: "12px",
                backgroundColor: COLORS.lightGray,
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <IonText style={{ fontSize: "12px", color: COLORS.gray }}>
                <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>Password Requirements:</p>
                <p style={{ margin: "2px 0" }}>• At least 8 characters</p>
                <p style={{ margin: "2px 0" }}>• Contains uppercase letter</p>
                <p style={{ margin: "2px 0" }}>• Contains lowercase letter</p>
                <p style={{ margin: "2px 0" }}>• Contains at least one number</p>
              </IonText>
            </div>

            {/* Confirm New Password */}
            <div style={{ position: "relative", marginBottom: "24px" }}>
              <CustomInput
                label="Confirm New Password"
                type={secureConfirmPassword ? "password" : "text"}
                value={confirmPassword}
                onIonInput={(e) => {
                  setConfirmPassword(e.detail.value!)
                  clearError("confirmPassword")
                }}
                error={errors.confirmPassword}
                placeholder="Confirm your new password"
                icon={lockClosedOutline}
                required
              />
              <IonButton
                type="button"
                fill="clear"
                size="small"
                onClick={() => setSecureConfirmPassword(!secureConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "8px",
                  zIndex: 10,
                  "--color": COLORS.gray,
                }}
                disabled={loading}
              >
                <IonIcon icon={secureConfirmPassword ? eyeOutline : eyeOffOutline} />
              </IonButton>
            </div>

            <CustomButton fullWidth size="large" onClick={handleChangePassword} loading={loading} disabled={loading}>
              {loading ? "Changing Password..." : "Change Password"}
            </CustomButton>

            {/* Security Note */}
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: COLORS.warning + "20",
                borderRadius: "8px",
                borderLeft: `4px solid ${COLORS.warning}`,
              }}
            >
              <IonText style={{ fontSize: "12px", color: COLORS.text }}>
                <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>Security Note:</p>
                <p style={{ margin: 0 }}>
                  After changing your password, you may need to sign in again on other devices for security purposes.
                </p>
              </IonText>
            </div>
          </form>
        </div>

        {/* Toast Messages */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={hideToast}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="top"
          buttons={[
            {
              text: "Dismiss",
              role: "cancel",
            },
          ]}
        />
      </IonContent>
    </IonPage>
  )
}

export default ChangePasswordPage
