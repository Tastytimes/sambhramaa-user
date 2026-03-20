import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UIState {
  loading: boolean
  toast: {
    message: string
    type: "success" | "error" | "warning" | "info"
    isOpen: boolean
  }
}

const initialState: UIState = {
  loading: false,
  toast: {
    message: "",
    type: "info",
    isOpen: false,
  },
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    showToast: (
      state,
      action: PayloadAction<{
        message: string
        type: "success" | "error" | "warning" | "info"
      }>,
    ) => {
      state.toast = {
        ...action.payload,
        isOpen: true,
      }
    },
    hideToast: (state) => {
      state.toast.isOpen = false
    },
  },
})

export const { setLoading, showToast, hideToast } = uiSlice.actions
export default uiSlice.reducer
