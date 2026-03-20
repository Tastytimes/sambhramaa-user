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
  IonToast,
  IonDatetime,
  IonModal,
  IonButton,
  IonItem,
  IonLabel,
} from "@ionic/react"
import {
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  calendarOutline,
  arrowBackOutline,
} from "ionicons/icons"
import { useHistory } from "react-router-dom"
import { useAppSelector } from "../hooks/useAppSelector"
import CustomInput from "../components/CustomInput"
import CustomButton from "../components/CustomButton"
import { COLORS } from "../theme/theme"
import type { ISignUpRequestPayload } from "../constants/interface"
import { authApi } from "../api/AuthApi"
import { AxiosError } from "axios"
import { setItem } from "../utills/storage"
import { useDispatch } from "react-redux"
import { setUser } from "../store/slices/authSlice"

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dob: "",
  })

  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const history = useHistory()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      history.replace("/dashboard")
    }
  }, [isAuthenticated, history])

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
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else {
      const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number"
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required"
    } else {
      const dobDate = new Date(formData.dob)
      const today = new Date()
      const age = today.getFullYear() - dobDate.getFullYear()
      if (age < 13) {
        newErrors.dob = "You must be at least 13 years old"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSignUp = async (): Promise<void> => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({}) // Clear previous errors

    try {
      // Prepare the payload according to your API interface
      const userData: ISignUpRequestPayload = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone, // Use 'phone' not 'phoneNumber'
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        dateOfBirth: new Date(formData.dob), // Use 'dob' not 'dateOfBirth'
      }

      const response = await authApi.signUp(userData)
      console.log(response)
      if (response.data) {
        // Store token if provided
        if (response.data?.token) {
          await setItem("userToken", response.data.token)
        }

        // Store user data if provided
        if (response.data?.user) {
          await setItem("userData", JSON.stringify(response.data.user))
           const user = {
                      name: response.data.user.name,
                      email: response.data.user.email,
                      phone: response.data.user.phoneNumber,
          
                    }
                    dispatch(setUser(user))
        }

        // Show success message
        showToast(response.data.message || "Account created successfully! Redirecting...", "success")

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          history.replace("/dashboard")
        }, 1500)
      } else {
        showToast(response.data.message || "Sign up failed. Please try again.", "danger")
      }
    } catch (error: unknown) {
     
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Sign up failed. Please try again."
        showToast(errorMessage, "danger")
      } else if (error instanceof Error) {
        showToast(error.message, "danger")
      } else {
        showToast("Sign up failed. Please try again.", "danger")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (e: CustomEvent): void => {
    const selectedDate = e.detail.value
    setFormData((prev) => ({
      ...prev,
      dob: selectedDate,
    }))
    setIsDateModalOpen(false)
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const handleBackNavigation = (): void => {
    history.goBack()
  }

  const handleLoginNavigation = (): void => {
    history.push("/login")
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Create Account</IonTitle>
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
            <IonText>
              <h2
                style={{
                  color: COLORS.text,
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                }}
              >
                Join Food Delivery
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
                Create your account to get started
              </p>
            </IonText>
          </div>

          {/* Sign Up Form */}
          <div>
            <CustomInput
              label="Full Name"
              type="text"
              value={formData.name}
              onIonInput={(e) => handleInputChange("name", e.detail.value!)}
              error={errors.name}
              placeholder="Enter your full name"
              icon={personOutline}
              required
            />

            <CustomInput
              label="Email Address"
              type="email"
              value={formData.email}
              onIonInput={(e) => handleInputChange("email", e.detail.value!)}
              error={errors.email}
              placeholder="Enter your email"
              icon={mailOutline}
              required
            />

            <CustomInput
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onIonInput={(e) => handleInputChange("phone", e.detail.value!)}
              error={errors.phone}
              placeholder="Enter your phone number"
              icon={callOutline}
              required
            />

            {/* Date of Birth */}
            <div style={{ marginBottom: "16px" }}>
              <IonItem
                button
                onClick={() => setIsDateModalOpen(true)}
                style={{
                  "--border-color": errors.dob ? COLORS.error : COLORS.gray,
                  "--border-width": "1px",
                  "--border-radius": "8px",
                  marginBottom: "4px",
                }}
              >
                <IonIcon icon={calendarOutline} slot="start" color="medium" />
                <IonLabel position="floating" style={{ color: COLORS.text }}>
                  Date of Birth <span style={{ color: COLORS.error }}>*</span>
                </IonLabel>
                <IonLabel style={{ color: formData.dob ? COLORS.text : COLORS.gray }}>
                  {formData.dob ? formatDate(formData.dob) : "Select your date of birth"}
                </IonLabel>
              </IonItem>
              {errors.dob && (
                <IonText color="danger" style={{ fontSize: "12px", marginLeft: "16px" }}>
                  {errors.dob}
                </IonText>
              )}
            </div>

            <CustomInput
              label="Password"
              type="password"
              value={formData.password}
              onIonInput={(e) => handleInputChange("password", e.detail.value!)}
              error={errors.password}
              placeholder="Create a password"
              icon={lockClosedOutline}
              required
            />

            <CustomInput
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onIonInput={(e) => handleInputChange("confirmPassword", e.detail.value!)}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              icon={lockClosedOutline}
              required
            />

            <CustomButton fullWidth size="large" onClick={handleSignUp} loading={loading} disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
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
              <IonText style={{ color: COLORS.gray }}>Already have an account?</IonText>
              <IonText
                color="primary"
                style={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: "600",
                }}
                onClick={handleLoginNavigation}
              >
                Sign In
              </IonText>
            </div>
          </div>
        </div>

        {/* Date Picker Modal */}
        <IonModal isOpen={isDateModalOpen} onDidDismiss={() => setIsDateModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Date of Birth</IonTitle>
              <IonButton fill="clear" slot="end" onClick={() => setIsDateModalOpen(false)}>
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonDatetime
              presentation="date"
              onIonChange={handleDateChange}
              max={new Date().toISOString()}
              value={formData.dob}
            />
          </IonContent>
        </IonModal>

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
      </IonContent>
    </IonPage>
  )
}

export default SignUp
