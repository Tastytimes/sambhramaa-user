import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { Geolocation } from "@capacitor/geolocation"
import { addressApi } from "../../api/AddressApi"
import type { Address } from "../../constants/addressInterface"
import { CurrentLocation } from "../../constants/dashbaordInterface"
import { successResponse } from "../../constants/interface"
// import type { CurrentLocation } from "../../types/dashboard"

interface LocationState {
  currentLocation: CurrentLocation | null
  selectedAddress: Address | null
  savedAddresses: Address[]
  loading: boolean
  error: string | null
  hasLocationPermission: boolean
}

const initialState: LocationState = {
  currentLocation: null,
  selectedAddress: null,
  savedAddresses: [],
  loading: false,
  error: null,
  hasLocationPermission: false,
}

// Get current location
export const getCurrentLocation = createAsyncThunk("location/getCurrentLocation", async (_, { rejectWithValue }) => {
  try {
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    })

    const { latitude, longitude } = coordinates.coords

    // Mock reverse geocoding - replace with actual service
    let address = "Current Location"
    let area = ""
    let city = ""

    try {
      // You can replace this with actual reverse geocoding service
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.features && data.features.length > 0) {
          address = data.features[0].place_name
          const context: { id: string; text: string }[] = data.features[0].context || []
          area = context.find((c) => c.id.includes("locality"))?.text || ""
          city = context.find((c) => c.id.includes("place"))?.text || ""
        }
      }
    } catch {
      console.warn("Reverse geocoding failed, using coordinates")
      address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }

    return {
      latitude,
      longitude,
      address,
      area,
      city,
    } as CurrentLocation
  } catch (error: unknown) {
    return rejectWithValue((error as Error).message || "Failed to get current location")
  }
})

// Fetch saved addresses
export const fetchSavedAddresses = createAsyncThunk("location/fetchSavedAddresses", async (_, { rejectWithValue }) => {
  try {
    const response = await addressApi.getAllAddress() as successResponse<Address[]>
    if (Array.isArray(response.data)) {
      return response.data
    } else if (
      response.data &&
      typeof response.data === "object" &&
      "addresses" in response.data &&
      Array.isArray((response.data as Record<string, unknown>).addresses)
    ) {
      return (response.data as { addresses: Address[] }).addresses
    } else {
      return []
    }
  } catch (error: unknown) {
    return rejectWithValue((error as Error).message || "Failed to fetch saved addresses")
  }
})

// Check if current location matches any saved address
export const checkLocationMatch = createAsyncThunk(
  "location/checkLocationMatch",
  async (currentLocation: CurrentLocation, { getState, dispatch }) => {
    const state = getState() as { location: LocationState }
    const { savedAddresses } = state.location

    // Check if current location matches any saved address (within 100m radius)
    const matchedAddress = savedAddresses.find((address) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        address.location.coordinates[1],
        address.location.coordinates[0],
      )
      return distance < 0.1 // 100 meters
    })

    if (matchedAddress) {
      dispatch(setSelectedAddress(matchedAddress))
      return matchedAddress
    }

    return null
  },
)

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setSelectedAddress: (state, action: PayloadAction<Address | null>) => {
      state.selectedAddress = action.payload
    },
    setCurrentLocation: (state, action: PayloadAction<CurrentLocation | null>) => {
      state.currentLocation = action.payload
    },
    clearSelectedAddress: (state) => {
      state.selectedAddress = null
    },
    addSavedAddress: (state, action: PayloadAction<Address>) => {
      state.savedAddresses.push(action.payload)
    },
    updateSavedAddress: (state, action: PayloadAction<Address>) => {
      const index = state.savedAddresses.findIndex((addr) => addr.id === action.payload.id)
      if (index !== -1) {
        state.savedAddresses[index] = action.payload
      }
    },
    removeSavedAddress: (state, action: PayloadAction<string>) => {
      state.savedAddresses = state.savedAddresses.filter((addr) => addr.id !== action.payload)
    },
    clearError: (state) => {
      state.error = null
    },
    setHasLocationPermission: (state, action: PayloadAction<boolean>) => {
      state.hasLocationPermission = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Get current location
      .addCase(getCurrentLocation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.loading = false
        state.currentLocation = action.payload
        state.hasLocationPermission = true
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.hasLocationPermission = false
      })
      // Fetch saved addresses
      .addCase(fetchSavedAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSavedAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.savedAddresses = action.payload
      })
      .addCase(fetchSavedAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setSelectedAddress,
  setCurrentLocation,
  clearSelectedAddress,
  addSavedAddress,
  updateSavedAddress,
  removeSavedAddress,
  clearError,
  setHasLocationPermission,
} = locationSlice.actions

export default locationSlice.reducer
