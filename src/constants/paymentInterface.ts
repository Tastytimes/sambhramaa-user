export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name: string
    email: string
    contact: string
  }
  notes: {
    address: string
  }
  theme: {
    color: string
  }
  modal: {
    ondismiss: () => void
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface CreateOrderPayload {
  amount: number
  currency: string
  receipt: string
  notes: {
    app: string
  }
}

export interface CreateOrderResponse {
  success: boolean
  data: {
    id: string
    entity: string
    amount: number
    amount_paid: number
    amount_due: number
    currency: string
    receipt: string
    status: string
    created_at: number
  }
  message?: string
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_details: {
    outletId: string
    items: Array<{
      foodItemId: string
      quantity: number
      price: number
      totalPrice: number
    }>
    totalAmount: number
    deliveryAddress: string
  }
}

export interface VerifyPaymentResponse {
  success: boolean
  data: {
    orderId: string
    status: string
    paymentId: string
  }
  message?: string
}

export interface PaymentApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface OrderDetails {
  orderId: string
  amount: number
  currency: string
  receipt: string
  status: "created" | "attempted" | "paid" | "failed"
  createdAt: string
  items: CartItem[]
  deliveryAddress: string
  userDetails: {
    name: string
    email: string
    contact: string
  }
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  restaurant: string
}

// Global Razorpay interface for web
declare global {
  interface Window {
    Razorpay: unknown
  }
}
