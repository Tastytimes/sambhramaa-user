"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonText, IonIcon, IonToast } from "@ionic/react"
import { mailOutline, lockClosedOutline, personOutline } from "ionicons/icons"
import { useHistory } from "react-router-dom"
// import { useAppDispatch, } from "../hooks/useAppDispatch"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"
import { COLORS } from "../theme/theme"
import type { ILoginRequestPayload } from "../constants/interface"
import { authApi } from "../api/AuthApi"
import { AxiosError } from "axios"
import { useAppSelector } from "../hooks/useAppSelector"
import { setItem } from "../utills/storage"
import { useDispatch } from "react-redux"
import { setUser } from "../store/slices/authSlice"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

const Login: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const history = useHistory()
  const dispatch = useDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      history.replace("/dashboard")
    }
  }, [isAuthenticated, history])

  const showToast = (message: string, color: ToastState["color"] = "primary") => {
    setToast({
      isOpen: true,
      message,
      color,
    })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = "Email or phone number is required"
    } else if (emailOrPhone.includes("@")) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailOrPhone)) {
        newErrors.emailOrPhone = "Please enter a valid email address"
      }
    } else {
      // Phone validation
      const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
      if (!phoneRegex.test(emailOrPhone)) {
        newErrors.emailOrPhone = "Please enter a valid phone number"
      }
    }

    if (!password.trim()) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({}) // Clear previous errors

    try {
      // Prepare payload based on input type
      const payload: ILoginRequestPayload = {
        emailOrPhone,
        password,
      }

      // Determine if input is email or phone
    

      const response = await authApi.login(payload)

        // Store token if provided
        if (response.data?.token) {
          await setItem("userToken", response.data.token)
        }
        // await storage.setItem("userToken", response.data.token)

        // Store user data if provided
        if (response.data?.user) {
          const userData = response.data.user
          const user = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            status: userData.status,
          }
          // Save to localStorage
          await setItem("userData", JSON.stringify(user))
          // Save to Redux
          dispatch(setUser(user))
        }

        // Show success message
        showToast("Login successful! Redirecting...", "success")

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          history.replace("/dashboard")
        }, 1500)
      
    } catch (error: unknown) {
      console.error("Login failed:", error)

      // Handle different types of errors
      let errorMessage = "Login failed. Please try again."

     if(error instanceof AxiosError && error.response   ) {
        errorMessage = error.response.data?.message || "An error occurred during login."
      }

      showToast(errorMessage, "danger")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUpNavigation = (): void => {
    history.push("/signup")
  }

  const handleForgotPassword = (): void => {
    history.push("/reset-password")
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Welcome Back</IonTitle>
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
          {/* Logo Section */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            <IonIcon
              icon={personOutline}
              style={{
                fontSize: "80px",
                color: COLORS.primary,
                marginBottom: "16px",
              }}
            />
            <IonText>
              <h1
                style={{
                  color: COLORS.text,
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                }}
              >
                Food Delivery
              </h1>
            </IonText>
            <IonText>
              <p
                style={{
                  color: COLORS.gray,
                  margin: 0,
                  fontSize: "16px",
                }}
              >
                Sign in to continue
              </p>
            </IonText>
          </div>

          {/* Login Form */}
          <div>
            <CustomInput
              label="Email or Phone Number"
              type="text"
              value={emailOrPhone}
              onIonInput={(e) => setEmailOrPhone(e.detail.value!)}
              error={errors.emailOrPhone}
              placeholder="Enter your email or phone"
              icon={mailOutline}
              required
            />

            <CustomInput
              label="Password"
              type="password"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value!)}
              error={errors.password}
              placeholder="Enter your password"
              icon={lockClosedOutline}
              required
            />

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <IonText
                color="primary"
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "14px",
                }}
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </IonText>
            </div>

            <CustomButton fullWidth size="large" onClick={handleLogin} loading={loading} disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </CustomButton>

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
              <IonText style={{ color: COLORS.gray }}>Don't have an account?</IonText>
              <IonText
                color="primary"
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: "600",
                }}
                onClick={handleSignUpNavigation}
              >
                Sign Up
              </IonText>
            </div>
          </div>
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

export default Login
