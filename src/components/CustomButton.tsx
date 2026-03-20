"use client"

import type React from "react"
import { IonButton, IonSpinner } from "@ionic/react"

interface CustomButtonProps {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: "solid" | "outline" | "clear"
  size?: "small" | "default" | "large"
  fullWidth?: boolean
  color?: string
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = "solid",
  size = "default",
  fullWidth = false,
  color = "primary",
}) => {
  return (
    <IonButton
      expand={fullWidth ? "block" : undefined}
      fill={variant === "solid" ? "solid" : variant === "outline" ? "outline" : "clear"}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      color={color}
      style={{
        height: size === "large" ? "48px" : size === "small" ? "32px" : "40px",
        fontWeight: "600",
        borderRadius: "8px",
        margin: "8px 0",
      }}
    >
      {loading ? <IonSpinner name="crescent" /> : children}
    </IonButton>
  )
}

export default CustomButton
