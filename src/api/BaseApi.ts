import axios from "axios"
import { getItem } from "../utills/storage"

const API_BASE_URL = "https://api.superzero.in/inbox-v1/"

// const API_BASE_URL = "http://localhost:8000/inbox-v1/"

const api = axios.create({
  baseURL: API_BASE_URL,
})


// Platform-aware request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Use our storage helper to get the token
      const authToken = await getItem("userToken")
      // console.log("Auth token from storage:", authToken)
      if (authToken && config.headers) {
        config.headers["userToken"] = authToken
      }
    } catch (error) {
      console.error("Error getting auth token from storage:", error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Platform-aware response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // console.log(error.response)
    if (error.response && error.response.status === 403) {
      // Handle unauthorized access
      try {
        // Use our storage helper to remove the token
        // await removeItem("userToken")
        // Redirect to login page - handle navigation in your component after catching this error
        // For example, in your component, check for 403 and use history.push("/login")
        // Handle redirection based on platform
       
        // For native platforms, you'll handle navigation differently
        // This will be handled by your navigation logic elsewhere
      } catch (storageError) {
        console.error("Error removing auth info from storage:", storageError)
      }
    }
    return Promise.reject(error)
  },
)

export default api
