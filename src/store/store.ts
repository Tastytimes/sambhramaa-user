import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import uiReducer from "./slices/uiSlice"
import locationReducer from "./slices/locationSlice"
import dashboardReducer from "./slices/dashboardSlice"
import cartReducer from "./slices/cartSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    location: locationReducer,
    dashboard: dashboardReducer,
    cart: cartReducer, // Assuming you have a cartReducer defined
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
