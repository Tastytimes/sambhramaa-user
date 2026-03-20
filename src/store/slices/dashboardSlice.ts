import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { Banner, Cuisine, DashboardData, DashboardRequestPayload, LoyaltyAccountBalance, Restaurant } from "../../constants/dashbaordInterface"
import { authApi } from "../../api/AuthApi"
// import type { DashboardData, DashboardRequestPayload, Restaurant } from "../../types/dashboard"

interface StaticData {
  banners: Banner[]
  popularCuisines: Cuisine[]
  loyalty: LoyaltyAccountBalance | null
}

interface DashboardState {
  data: DashboardData | null
  staticData: StaticData | null
  restaurants: Restaurant[]
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  error: string | null
  hasMorePages: boolean
  currentPage: number
  staticDataLoaded: boolean
  initialFetchDone: boolean
}

// Helper to load static data from localStorage
const loadStaticDataFromStorage = (): StaticData | null => {
  try {
    const stored = localStorage.getItem("dashboard_static_data")
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Failed to load static data from localStorage:", error)
  }
  return null
}

// Helper to save static data to localStorage
const saveStaticDataToStorage = (data: StaticData): void => {
  try {
    localStorage.setItem("dashboard_static_data", JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save static data to localStorage:", error)
  }
}

const initialState: DashboardState = {
  data: null,
  staticData: loadStaticDataFromStorage(),
  restaurants: [],
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
  hasMorePages: true,
  currentPage: 1,
  staticDataLoaded: loadStaticDataFromStorage() !== null,
  initialFetchDone: false,
}

// Fetch dashboard data
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (payload: DashboardRequestPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.getDashboard(payload)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Failed to fetch dashboard data")
    }
  },
)

// Load more restaurants
export const loadMoreRestaurants = createAsyncThunk(
  "dashboard/loadMoreRestaurants",
  async (payload: DashboardRequestPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.getDashboard(payload)
      return response.data
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || "Failed to load more restaurants")
    }
  },
)

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboard: (state) => {
      state.restaurants = []
      state.currentPage = 1
      state.hasMorePages = true
      state.error = null
      state.initialFetchDone = false
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    setInitialFetchDone: (state, action: PayloadAction<boolean>) => {
      state.initialFetchDone = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false
        state.initialFetchDone = true

        // Check if we received static data (banners or cuisines)
        const hasNewStaticData =
          (action.payload.banners && action.payload.banners.length > 0) ||
          (action.payload.popularCuisines && action.payload.popularCuisines.length > 0)

        if (hasNewStaticData) {
          // Update static data from API response
          const newStaticData: StaticData = {
            banners: action.payload.banners || state.staticData?.banners || [],
            popularCuisines: action.payload.popularCuisines || state.staticData?.popularCuisines || [],
            loyalty: action.payload.loyalty || state.staticData?.loyalty || null,
          }
          state.staticData = newStaticData
          state.staticDataLoaded = true
          saveStaticDataToStorage(newStaticData)
        } else if (action.payload.loyalty) {
          // Update loyalty even if no banners/cuisines
          if (state.staticData) {
            state.staticData.loyalty = action.payload.loyalty
            saveStaticDataToStorage(state.staticData)
          }
        }

        // Merge static data into dashboard data for compatibility
        state.data = {
          ...action.payload,
          banners: state.staticData?.banners || action.payload.banners || [],
          popularCuisines: state.staticData?.popularCuisines || action.payload.popularCuisines || [],
          loyalty: state.staticData?.loyalty || action.payload.loyalty || null,
        }

        state.restaurants = action.payload.outlets
        state.currentPage = action.payload.pagination.currentPage
        state.hasMorePages = action.payload.pagination.currentPage < action.payload.pagination.totalPages
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false
        state.initialFetchDone = true
        state.error = action.payload as string
      })
      // Load more restaurants
      .addCase(loadMoreRestaurants.pending, (state) => {
        state.loadingMore = true
        state.error = null
      })
      .addCase(loadMoreRestaurants.fulfilled, (state, action) => {
        state.loadingMore = false
        state.restaurants = [...state.restaurants, ...action.payload.outlets]
        state.currentPage = action.payload.pagination.currentPage
        state.hasMorePages = action.payload.pagination.currentPage < action.payload.pagination.totalPages

        // Update pagination in data
        if (state.data) {
          state.data.pagination = action.payload.pagination
        }
      })
      .addCase(loadMoreRestaurants.rejected, (state, action) => {
        state.loadingMore = false
        state.error = action.payload as string
      })
  },
})

export const { resetDashboard, setRefreshing, clearError, setInitialFetchDone } = dashboardSlice.actions

export default dashboardSlice.reducer
