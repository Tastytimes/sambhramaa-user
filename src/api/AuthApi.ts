import axios, { AxiosResponse } from "axios"
import api from "./BaseApi"
import type {
  IForgotPasswordPayload,
  ILoginRequestPayload,
  ISetPassword,
  ISetPasswordPayload,
  ISignUpRequestPayload,
  IUpdatePasswordPayload,
  IVerifyOtpRequestPayload,
} from "../constants/interface"
import { DashboardRequestPayload } from "../constants/dashbaordInterface"
// import { DashboardParams } from "../constants/dashbaordInterface"

export const authApi = {
  signUp: async (payload: ISignUpRequestPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post("/user-service/auth/signup", payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Signup failed")
      }
      throw error
    }
  },

  login: async (payload: ILoginRequestPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post(`/user-service/auth/login`, payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed")
      }
      throw error
    }
  },

  verifyOtp: async (payload: IVerifyOtpRequestPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post(`/user-service/auth/verify-otp`, payload)
      return response.data
    } catch (error) {
     if (axios.isAxiosError(error)) {
        const newError = new Error(error.response?.data?.message || "OTP verification failed")
        interface AxiosCustomError extends Error {
          originalError: unknown
          isAxiosError: boolean
          response?: unknown
        }
        const customError = newError as AxiosCustomError
        customError.originalError = error
        customError.isAxiosError = true
        customError.response = error.response
        throw customError
      }
      throw error
    }
  },

  resendOtp: async (payload: IForgotPasswordPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post(`/user-service/auth/resend-otp`, payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Resend OTP failed")
      }
      throw error
    }
  },

  setPassword: async (payload: ISetPasswordPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post(`/user-service/auth/update-reset-password`, payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Set password failed")
      }
      throw error
    }
  },

  resetPassword: async (payload: IForgotPasswordPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post(`/user-service/auth/forgot-password`, payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Reset password failed")
      }
      throw error
    }
  },

  updateProfile: async (payload: IUpdatePasswordPayload): Promise<AxiosResponse> => {
    try {
      console.log('Update profile payload:', payload)
    console.log('Making request to:', "/user-service/profile/update")
    const response = await api.put("/user-service/profile/update", payload)
    console.log('Update profile response:', response.data)
    return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Profile update failed")
      }
      throw error
    }
  },

  updatePassword: async (payload: ISetPassword): Promise<AxiosResponse> => {
    try {
      const response = await api.put("/user-service/profile/change-password", payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Password update failed")
      }
      throw error
    }
  },

  getProfile: async (): Promise<AxiosResponse> => {
    try {
      const response = await api.get("/user-service/get-profile")
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Get profile failed")
      }
      throw error
    }
  },

  logout: async (): Promise<AxiosResponse> => {
    try {
      const resp = await api.post("/user-service/auth/logout")
      return resp.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Logout failed")
      }
      throw error
    }
  },
  getDashboard: async (params: DashboardRequestPayload) => {
    const {
      latitude,
      longitude,
      page = 1,
      limit = 10,
      cuisines = "all",
      includeStaticData = true,
    } = params;

    try {
      const response = await api.get("/user-service/user/dashboard", {
        params: {
          latitude,
          longitude,
          page,
          limit,
          cuisines,
          includeStaticData,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  getRestaurantDetails: async (outletId: string, distance?: string) => {
    try {
      const response = await api.get(
        `user-service/user/get-restaurant/${outletId}`,
        {
          params: {
            distance,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      throw error;
    }
  },

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      // Mock reverse geocoding - replace with actual service
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=YOUR_MAPBOX_TOKEN`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name
        }
      }

      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    } catch (error) {
      console.warn("Reverse geocoding failed:", error)
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }
  }
}
