import { createAsyncThunk } from "@reduxjs/toolkit"
import { OrdersApi } from "../../api/OrderApi"
// Async thunk to fetch cart items from API and update cart slice
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { dispatch, rejectWithValue }) => {
  try {
    dispatch(setLoading(true))
    const response = await OrdersApi.getCartItems()
    if (response.data && response.data.cart) {
      dispatch(
        updateCart({
          outletId: response.data.cart.outletId || null,
          containerTotal: response.data.cart.containerTotal || 0,
          itemTotal: response.data.cart.itemTotal || 0,
          subtotal: response.data.cart.subtotal || 0,
          items: response.data.cart.items || [],
          restaurantName: response.data.cart.restaurantName || response.data.restaurantName || "",
          appliedCharges: response.data.cart.appliedCharges || [],
        })
      )
    } else {
      dispatch(clearCart())
    }
    dispatch(setLoading(false))
  } catch (error: unknown) {
    dispatch(setError((error as Error).message || "Failed to fetch cart"))
    dispatch(setLoading(false))
    return rejectWithValue((error as Error).message || "Failed to fetch cart")
  }
})
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Define interfaces based on your API response
export interface CartItem {
  foodImage: string
  containerCharge: number
  containerTotal: number
  foodItemId: string
  itemTotal: number
  name: string
  price: number
  quantity: number
}

export interface AppliedCharge {
  chargeId: string
  name: string
  type: string
  appliesTo: string
  baseAmount: number
  value: number
  amount: number
  taxAmount: number
  totalAmount: number
  meta?: Record<string, unknown>
}

export interface CartState {
  outletId: string | null
  containerTotal: number
  itemTotal: number
  subtotal: number
  items: CartItem[]
  restaurantName: string
  appliedCharges: AppliedCharge[]
  loading: boolean
  error: string | null
}

const initialState: CartState = {
  outletId: null,
  containerTotal: 0,
  itemTotal: 0,
  subtotal: 0,
  restaurantName: "",
  appliedCharges: [],
  items: [],
  loading: false,
  error: null,
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    clearError: (state) => {
      state.error = null
    },
    updateCart: (
      state,
      action: PayloadAction<{
        outletId: string | null
        containerTotal: number
        itemTotal: number
        subtotal: number
        items: CartItem[]
        restaurantName?: string
        appliedCharges?: AppliedCharge[]
      }>,
    ) => {
      state.outletId = action.payload.outletId
      state.containerTotal = action.payload.containerTotal
      state.itemTotal = action.payload.itemTotal
      state.subtotal = action.payload.subtotal
      state.items = action.payload.items
      state.restaurantName = action.payload.restaurantName ?? state.restaurantName ?? ""
      state.appliedCharges = action.payload.appliedCharges ?? []
      state.loading = false
      state.error = null
    },
    clearCart: (state) => {
      state.outletId = null
      state.containerTotal = 0
      state.itemTotal = 0
      state.subtotal = 0
      state.items = []
      state.restaurantName = ""
      state.appliedCharges = []
      state.loading = false
      state.error = null
    },
    // Helper to update single item quantity locally (optimistic update)
    updateItemQuantity: (state, action: PayloadAction<{ foodItemId: string; quantity: number }>) => {
      const { foodItemId, quantity } = action.payload
      const itemIndex = state.items.findIndex((item) => item.foodItemId === foodItemId)

      if (itemIndex !== -1) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items.splice(itemIndex, 1)
        } else {
          // Update quantity
          state.items[itemIndex].quantity = quantity
          state.items[itemIndex].itemTotal = state.items[itemIndex].price * quantity
        }

        // Recalculate totals
        state.itemTotal = state.items.reduce((total, item) => total + item.itemTotal, 0)
        state.containerTotal = state.items.reduce((total, item) => total + item.containerTotal, 0)
        state.subtotal = state.itemTotal + state.containerTotal
      }
    },
  },
})

export const { setLoading, setError, clearError, updateCart, clearCart, updateItemQuantity } = cartSlice.actions

export default cartSlice.reducer

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart
export const selectCartItems = (state: { cart: CartState }) => state.cart.items
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0)
export const selectCartTotal = (state: { cart: CartState }) => state.cart.subtotal
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading
export const selectItemQuantity = (foodItemId: string) => (state: { cart: CartState }) => {
  const item = state.cart.items.find((item) => item.foodItemId === foodItemId)
  return item ? item.quantity : 0
}
