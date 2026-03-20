import type React from "react"
import { IonItem, IonInput, IonText, IonIcon } from "@ionic/react"
import { COLORS } from "../theme/theme"

interface CustomInputProps {
  label: string
  type?: "text" | "email" | "password" | "tel"
  value: string
  onIonInput: (e: CustomEvent) => void
  error?: string
  placeholder?: string
  icon?: string
  required?: boolean
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  type = "text",
  value,
  onIonInput,
  error,
  icon,
  required = false,
}) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <IonItem
        style={{
          "--border-color": error ? COLORS.error : COLORS.gray,
          "--border-width": "1px",
          "--border-radius": "8px",
          marginBottom: "4px",
        }}
      >
        {icon && <IonIcon icon={icon} slot="start" color="medium" />}
        <IonInput
          type={type}
          value={value}
          placeholder={`${label}${required ? " *" : ""}`}
          onIonInput={onIonInput}
          style={{ color: COLORS.text }}
          clearInput={true}
        />
      </IonItem>
      {error && (
        <IonText color="danger" style={{ fontSize: "12px", marginLeft: "16px" }}>
          {error}
        </IonText>
      )}
    </div>
  )
}

export default CustomInput
