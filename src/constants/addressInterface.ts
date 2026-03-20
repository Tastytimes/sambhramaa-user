

// export interface Location {
//   type: "Point"
//   coordinates: [number, number] // [longitude, latitude]
// }

export interface Location {
  type: "Point"
  coordinates: [number, number]
}

export interface Address {
  id: string
  locationName: string
  fullAddress: string
  houseFlatFloorNo: string
  apartmentRoadArea: string
  location: Location
  directionsToReach?: string
  addressType: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  isDefault?: boolean
}

export type AddressType = "home" | "work" | "friends_family" | "other" | ""

export interface AddressRequestPayload {
  locationName: string
  fullAddress: string
  houseFlatFloorNo: string
  apartmentRoadArea: string
  location: Location
  directionsToReach?: string
  addressType: string
}

export interface UpdateAddressPayload {
  id: string
  locationName?: string
  fullAddress?: string
  houseFlatFloorNo?: string
  apartmentRoadArea?: string
  location?: Location
  directionsToReach?: string
  addressType?: string
  phoneNumber?: string
}

export interface AddressApiResponse {
  success: boolean
  message: string
  data: Address | Address[]
}

export interface LocationCoordinates {
  latitude: number
  longitude: number
  latitudeDelta?: number
  longitudeDelta?: number
}

export interface AddressDetails {
  formattedAddress: string
  streetNumber: string
  route: string
  locality: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface GeolocationPosition {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
    altitude?: number
    altitudeAccuracy?: number
    heading?: number
    speed?: number
  }
  timestamp: number
}

export interface AddressFormData {
  houseNumber: string
  apartmentRoad: string
  directions: string
  addressType: AddressType
  customName: string
}

export interface AddressValidationError {
  field: string
  message: string
}

export interface AddressSearchResult {
  id: string
  description: string
  placeId?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

// For backward compatibility with existing auth interfaces
export interface ILoginRequestPayload {
  email?: string
  phone?: string
  password: string
}

export interface ISignUpRequestPayload {
  name: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  dateOfBirth: Date
}

export interface IForgotPasswordPayload {
  emailOrPhone: string
}

export interface IVerifyOtpRequestPayload {
  emailOrPhone: string
  otp: number
}

export interface ISetPasswordPayload {
  sessionId: string
  newPassword: string
  confirmNewPassword: string
}

export interface ISetPassword {
  oldPassword: string
  newPassword: string
}

export interface IUpdatePasswordPayload {
  name?: string
  email?: string
  phone?: string
}
