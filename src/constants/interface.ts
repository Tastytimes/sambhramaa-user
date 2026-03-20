export interface ISignUpRequestPayload {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
  phoneNumber: string;
  dateOfBirth: Date;
}

export interface ILoginRequestPayload {
  emailOrPhone: string;
  password: string;
}

export interface IForgotPasswordPayload {
  emailOrPhone: string;
}

export interface IVerifyOtpRequestPayload {
  emailOrPhone: string;
  otp: number;
}

export interface ISetPasswordPayload {
  sessionId: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface SignupResponse {
  data: {
    token: string;
    user: User;
  };
  message: string;
}

export interface IUpdatePasswordPayload {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface successResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
}
export interface ISetPassword {
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
}

// Define the location coordinates structure
export interface AddressLocation {
  type: string; // Usually "Point" for GeoJSON
  coordinates: [number, number]; // [longitude, latitude]
}

// Define the main address payload interface
export interface AddressRequestPayload {
  id?: string;
  locationName: string; // Name of the location (e.g., "Home", "Work", or custom name)
  fullAddress: string; // Complete address string
  houseFlatFloorNo: string; // House/flat/floor number
  apartmentRoadArea: string; // Apartment name, road, area
  location: AddressLocation; // GeoJSON location object
  directionsToReach?: string; // Optional directions to reach
  addressType: string; // Type of address (HOME, WORK, FRIENDS_FAMILY, OTHER)
  phoneNumber?: string
}

export interface AddToCartPayload {
  foodItemId: string;
  quantity: number;
  forceReplace: boolean;
  outletId: string;
}

export interface CreateOrderPayload {
  outletId: string;
  addressId: string;
}

export interface CreateOrderResponse {
  message: string;
  data: {
    razorpayOrderId: string;
    orderId: string;
    amount: number;
    currency: string;
  };
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  message: string;
  data: {
    orderId: string;
    paymentStatus: "success" | "failed";
    transactionId: string;
  };
}

export interface OrderStatusResponse {
  message: string;
  data: {
    orderId: string;
    status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "out_for_delivery"
      | "delivered"
      | "cancelled";
    paymentStatus: "pending" | "success" | "failed";
    estimatedDeliveryTime?: string;
    orderDetails?: {
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
      }>;
      totalAmount: number;
      deliveryAddress: string;
      restaurantName: string;
      orderTime: string;
    };
    trackingDetails?: {
      currentStatus: string;
      statusHistory: Array<{
        status: string;
        timestamp: string;
        description: string;
      }>;
    };
  }
}