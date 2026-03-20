import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import { CreateOrderPayload } from "../constants/interface"
import { OrdersApi } from "../api/OrderApi"
import { RazorpayOptions, RazorpayResponse, VerifyPaymentPayload } from "../constants/paymentInterface"
// import type {
//   RazorpayOptions,
//   RazorpayResponse,
//   CreateOrderPayload,
//   VerifyPaymentPayload,
// } from "../constants/paymentInterface"

declare global {
  interface Window {
    Razorpay: unknown
  }
}

export class PaymentService {
  private static readonly RAZORPAY_KEY = "rzp_test_W7qQ8SUKcfPNaj"
  private static readonly COMPANY_NAME = "Ioshii"

  static async loadRazorpayScript(): Promise<boolean> {
    // For native platforms, we'll use in-app browser
    if (Capacitor.isNativePlatform()) {
      return true
    }

    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  static async createOrder(addressId: string, outletId: string): Promise<string> {
    try {
      const payload: CreateOrderPayload = {
        addressId,
        outletId,
      }

      const response = await OrdersApi.createOrder(payload)

      if (!response.data) {
        throw new Error(response.data?.message || "Failed to create order")
      }

      return response.data.id
    } catch (error) {
      console.error("Error creating order:", error)
      throw error
    }
  }

  static async initiatePayment(
    orderId: string,
    amount: number,
    userDetails: {
      name: string
      email: string
      contact: string
    },
    address: string,
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: unknown) => void,
  ): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use in-app browser for native platforms
        await this.initiateNativePayment(orderId, amount, userDetails, address, onSuccess, onFailure)
      } else {
        // Use web SDK for browser
        await this.initiateWebPayment(orderId, amount, userDetails, onSuccess, onFailure)
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      onFailure(error)
    }
  }

  private static async initiateNativePayment(
    orderId: string,
    amount: number,
    userDetails: {
      name: string
      email: string
      contact: string
    },
    address: string,
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: unknown) => void,
  ): Promise<void> {
    try {
      // Create a payment URL with all necessary parameters
      const paymentUrl = this.createPaymentUrl(orderId, amount, userDetails)

      // Open in-app browser
      await Browser.open({
        url: paymentUrl,
        windowName: "_blank",
        toolbarColor: "#FF6B35",
        presentationStyle: "popover",
      })

      // Listen for browser close event
      Browser.addListener("browserFinished", () => {
        // You'll need to implement a way to check payment status
        // This could be through polling your backend or using deep links
        this.checkPaymentStatus(orderId, onSuccess, onFailure)
      })
    } catch (error) {
      onFailure(error)
    }
  }

  private static createPaymentUrl(
    orderId: string,
    amount: number,
    userDetails: {
      name: string
      email: string
      contact: string
    },
    
  ): string {
    const baseUrl = "https://checkout.razorpay.com/v1/checkout.js"
    const params = new URLSearchParams({
      key: this.RAZORPAY_KEY,
      amount: (amount ).toString(),
      currency: "INR",
      name: this.COMPANY_NAME,
      description: "Food Order Payment",
      order_id: orderId,
      prefill_name: userDetails.name,
      prefill_email: userDetails.email,
      prefill_contact: userDetails.contact,
      theme_color: "#FF6B35",
      callback_url: `${window.location.origin}/payment-callback`,
      cancel_url: `${window.location.origin}/payment-cancel`,
    })

    return `${baseUrl}?${params.toString()}`
  }

  private static async checkPaymentStatus(
    orderId: string,
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: unknown) => void,
  ): Promise<void> {
    try {
      // Poll your backend to check payment status
      const response = await OrdersApi.getOrderStatus(orderId)

      if (response.data ) {
        const razorpayResponse: RazorpayResponse = {
          razorpay_payment_id: response.data.paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: response.data.signature,
        }
        onSuccess(razorpayResponse)
      } else if (response.data.status === "failed") {
        onFailure(new Error("Payment failed"))
      } else {
        onFailure(new Error("Payment cancelled"))
      }
    } catch (error) {
      onFailure(error)
    }
  }

  private static async initiateWebPayment(
    orderId: string,
    amount: number,
    userDetails: {
      name: string
      email: string
      contact: string
    },
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: unknown) => void,
  ): Promise<void> {
    const isLoaded = await this.loadRazorpayScript()

    if (!isLoaded) {
      throw new Error("Failed to load Razorpay SDK")
    }
    console.log("payment options", orderId, amount, userDetails)

    const options: RazorpayOptions = {
      key: this.RAZORPAY_KEY,
      amount: amount , // Convert to paise
      currency: "INR",
      name: this.COMPANY_NAME,
      description: "Food Order Payment",
      order_id: orderId,
      handler: onSuccess,
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.contact,
      },
      
      modal: {
        ondismiss: () => {
          onFailure(new Error("Payment cancelled by user"))
        },
      },
    }

    interface RazorpayInstance {
      open(): void
    }
    const RazorpayConstructor = window.Razorpay as new (options: RazorpayOptions) => RazorpayInstance
    const razorpay = new RazorpayConstructor(options)
    razorpay.open()
  }

  static async verifyPayment(paymentResponse: RazorpayResponse, orderDetails: any) {
    try {
      const payload: VerifyPaymentPayload = {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        order_details: orderDetails,
      }

      
      return payload
    } catch (error) {
      console.error("Error verifying payment:", error)
      throw error
    }
  }
}
