"use client"

import React, { JSX } from "react"
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
import { mailOutline, lockClosedOutline, arrowBackOutline, checkmarkCircleOutline } from "ionicons/icons"
import { useAppDispatch } from "../hooks/useAppDispatch"
import { clearError } from "../store/slices/authSlice"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"
import { COLORS } from "../theme/theme"
import { useAppSelector } from "../hooks/useAppSelector"
import { authApi } from "../api/AuthApi"
import type { IForgotPasswordPayload, IVerifyOtpRequestPayload, ISetPasswordPayload } from "../constants/interface"
import { setItem } from "../utills/storage"
import { useHistory } from "react-router"

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

const ResetPassword: React.FC = () => {
  const [step, setStep] = useState<"email" | "otp" | "newPassword">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const dispatch = useAppDispatch()
  const { error } = useAppSelector((state) => state.auth)
const history = useHistory()
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

  const validateEmail = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOTP = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!otp.trim()) {
      newErrors.otp = "OTP is required"
    } else if (!/^\d+$/.test(otp)) {
      newErrors.otp = "OTP must contain only numbers"
    } else if (otp.length < 4) {
      newErrors.otp = "OTP must be at least 4 digits"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateNewPassword = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleError = (error: unknown, defaultMessage: string, fieldName: string): void => {
    console.log(`${fieldName} failed`, error)
    console.error(`${fieldName} failed:`, error)

    let errorMessage = defaultMessage

    // Check if it's our preserved AxiosError
    if (error && typeof error === "object" && "isAxiosError" in error) {
      const customError = error as CustomError
      if (customError.isAxiosError || customError.originalError) {
        const axiosError = customError.originalError || customError
        console.log("This is an Axios error:", axiosError)

        // Access response data
        errorMessage = (axiosError as CustomError).response?.data?.message || customError.message || defaultMessage
      }
    } else if (error instanceof Error) {
      errorMessage = error.message || defaultMessage
    }

    showToast(errorMessage, "danger")
    setErrors({ [fieldName]: errorMessage })
  }

  const handleSendOTP = async (): Promise<void> => {
    if (!validateEmail()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const payload: IForgotPasswordPayload = {
        emailOrPhone: email,
      }

      const response = await authApi.resetPassword(payload)

      if (response.data) {
        showToast("OTP sent successfully to your email!", "success")
        setStep("otp")
      }
    } catch (error: unknown) {
      handleError(error, "Failed to send OTP. Please try again.", "email")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (): Promise<void> => {
    if (!validateOTP()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const payload: IVerifyOtpRequestPayload = {
        emailOrPhone: email,
        otp: Number.parseInt(otp, 10),
      }

      const response = await authApi.verifyOtp(payload)

      if (response.data && response.data?.sessionId) {
        setSessionId(response.data.sessionId)
        showToast("OTP verified successfully!", "success")
        setStep("newPassword")
      } else {
        const errorMessage = response.data?.message || "OTP verification failed"
        showToast(errorMessage, "danger")
        setErrors({ otp: errorMessage })
      }
    } catch (error: unknown) {
      handleError(error, "OTP verification failed. Please try again.", "otp")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (): Promise<void> => {
    if (!validateNewPassword()) {
      return
    }

    if (!sessionId) {
      showToast("Session expired. Please start over.", "danger")
      setStep("email")
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const payload: ISetPasswordPayload = {
        sessionId,
        newPassword,
        confirmNewPassword: confirmPassword,
      }

      const response = await authApi.setPassword(payload)

      if (response.data?.token) {
        await setItem("userToken", response.data.token)
      }

      // Store user data if provided
      if (response.data?.user) {
        await setItem("userData", JSON.stringify(response.data.user))
      }

      // Show success message
      showToast(response.data?.message || "Password reset successfully! Redirecting...", "success")

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        history.replace("/dashboard")
      }, 1500)
    } catch (error: unknown) {
      handleError(error, "Failed to reset password. Please try again.", "newPassword")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async (): Promise<void> => {
    setLoading(true)

    try {
      const payload: IForgotPasswordPayload = {
        emailOrPhone: email,
      }

      const response = await authApi.resendOtp(payload)

      if (response.data) {
        showToast("OTP resent successfully!", "success")
      }
    } catch (error: unknown) {
      console.log("Resend OTP failed", error)
      console.error("Resend OTP failed:", error)

      let errorMessage = "Failed to resend OTP"

      // Check if it's our preserved AxiosError
      if (error && typeof error === "object" && "isAxiosError" in error) {
        const customError = error as CustomError
        if (customError.isAxiosError || customError.originalError) {
          const axiosError = customError.originalError || customError
          console.log("This is an Axios error:", axiosError)

          errorMessage =
            (axiosError as CustomError).response?.data?.message || customError.message || "Failed to resend OTP"
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || "Failed to resend OTP"
      }

      showToast(errorMessage, "danger")
    } finally {
      setLoading(false)
    }
  }

  const renderEmailStep = (): JSX.Element => (
    <div>
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <IonIcon
          icon={mailOutline}
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
            Reset Password
          </h2>
        </IonText>
        <IonText>
          <p
            style={{
              color: COLORS.gray,
              margin: 0,
              fontSize: "16px",
            }}
          >
            Enter your email address and we'll send you an OTP to reset your password
          </p>
        </IonText>
      </div>

      <CustomInput
        label="Email Address"
        type="email"
        value={email}
        onIonInput={(e) => setEmail(e.detail.value!)}
        error={errors.email}
        placeholder="Enter your email"
        icon={mailOutline}
        required
      />

      <CustomButton fullWidth size="large" onClick={handleSendOTP} loading={loading} disabled={loading}>
        {loading ? "Sending OTP..." : "Send OTP"}
      </CustomButton>
    </div>
  )

  const renderOTPStep = (): JSX.Element => (
    <div>
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <IonIcon
          icon={mailOutline}
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
            Verify OTP
          </h2>
        </IonText>
        <IonText>
          <p
            style={{
              color: COLORS.gray,
              margin: 0,
              fontSize: "16px",
            }}
          >
            We've sent an OTP to {email}
          </p>
        </IonText>
      </div>

      <CustomInput
        label="Enter OTP"
        type="text"
        value={otp}
        onIonInput={(e) => setOtp(e.detail.value!)}
        error={errors.otp}
        placeholder="Enter OTP"
        required
      />

      <div
        style={{
          padding: "16px",
          backgroundColor: COLORS.lightGray,
          borderRadius: "8px",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <IonText style={{ fontSize: "12px", color: COLORS.gray }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>Demo OTP:</p>
          <p style={{ margin: 0 }}>1234</p>
        </IonText>
      </div>

      <CustomButton fullWidth size="large" onClick={handleVerifyOTP} loading={loading} disabled={loading}>
        {loading ? "Verifying..." : "Verify OTP"}
      </CustomButton>

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <IonText
          color="primary"
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "14px",
          }}
          onClick={handleResendOTP}
        >
          Resend OTP
        </IonText>
      </div>
    </div>
  )

  const renderNewPasswordStep = (): JSX.Element => (
    <div>
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <IonIcon
          icon={checkmarkCircleOutline}
          style={{
            fontSize: "60px",
            color: COLORS.success,
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
            Set New Password
          </h2>
        </IonText>
        <IonText>
          <p
            style={{
              color: COLORS.gray,
              margin: 0,
              fontSize: "16px",
            }}
          >
            Create a new password for your account
          </p>
        </IonText>
      </div>

      <CustomInput
        label="New Password"
        type="password"
        value={newPassword}
        onIonInput={(e) => setNewPassword(e.detail.value!)}
        error={errors.newPassword}
        placeholder="Enter new password"
        icon={lockClosedOutline}
        required
      />

      <CustomInput
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onIonInput={(e) => setConfirmPassword(e.detail.value!)}
        error={errors.confirmPassword}
        placeholder="Confirm new password"
        icon={lockClosedOutline}
        required
      />

      <CustomButton fullWidth size="large" onClick={handleResetPassword} loading={loading} disabled={loading}>
        {loading ? "Resetting Password..." : "Reset Password"}
      </CustomButton>
    </div>
  )

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100%",
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          {step === "email" && renderEmailStep()}
          {step === "otp" && renderOTPStep()}
          {step === "newPassword" && renderNewPasswordStep()}

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <IonText style={{ color: COLORS.gray }}>Remember your password?</IonText>
            <IonText
              color="primary"
              style={{
                cursor: "pointer",
                textDecoration: "underline",
                fontWeight: "600",
              }}
              onClick={() => history.replace("/login")}
            >
              Sign In
            </IonText>
          </div>
        </div>

        {/* Redux Error Toast */}
        <IonToast
          isOpen={!!error}
          onDidDismiss={() => dispatch(clearError())}
          message={error || ""}
          duration={3000}
          color="danger"
          position="top"
        />

        {/* Custom Toast Messages */}
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
      </IonContent>
    </IonPage>
  )
}

export default ResetPassword
