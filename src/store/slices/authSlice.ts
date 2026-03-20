import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authApi } from "../../api/AuthApi"

interface User {
  id: string
  name: string
  email: string
  phoneNumber: string
  status: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { emailOrPhone: string; password: string }) => {
    // Simulate API call
    // await new Promise((resolve) => setTimeout(resolve, 1500))

    // // Mock successful login
    // if (credentials.emailOrPhone === "test@example.com" && credentials.password === "password") {
    //   return {
    //     id: "1",
    //     name: "John Doe",
    //     email: "test@example.com",
    //     phone: "+1234567890",
    //   }
    // } else {
    //   throw new Error("Invalid credentials")
    // }

    const response = await authApi.login({
      emailOrPhone: credentials.emailOrPhone,
      password: credentials.password,
    })
    return response.data
  },
)

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (userData: {
    name: string
    email: string
    phone: string
    password: string
    dob: string
  }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      id: "2",
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      phoneNumber: userData.phone,
      status: true, // or set to false if needed
    }
  },
)



export const verifyOTP = createAsyncThunk("auth/verifyOTP", async (otp: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (otp === "1234") {
    return { verified: true }
  } else {
    throw new Error("Invalid OTP")
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    // New: setUser to replace user object directly
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  

})

export const { logout, clearError, updateUser, setUser } = authSlice.actions
export default authSlice.reducer
