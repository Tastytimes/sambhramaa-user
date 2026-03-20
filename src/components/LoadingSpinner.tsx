import type React from "react"
import { IonSpinner, IonText } from "@ionic/react"
import { COLORS } from "../theme/theme"

interface LoadingSpinnerProps {
  message?: string
  size?: "small" | "default" | "large"
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading...", size = "default" }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <IonSpinner
        name="crescent"
        color="primary"
        style={{
          width: size === "small" ? "20px" : size === "large" ? "40px" : "30px",
          height: size === "small" ? "20px" : size === "large" ? "40px" : "30px",
        }}
      />
      {message && (
        <IonText
          style={{
            marginTop: "10px",
            color: COLORS.gray,
            fontSize: "14px",
          }}
        >
          {message}
        </IonText>
      )}
    </div>
  )
}

export default LoadingSpinner
