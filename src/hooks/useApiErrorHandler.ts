import { useEffect } from "react"
import api from "../api/BaseApi"

/**
 * Global API error handler hook.
 * Navigates to /login on 403 and removes userToken and userData.
 * Call this ONCE in your App.tsx or main layout component.
 */
export function useApiErrorHandler() {
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        try {
          console.log("API error interceptor:", error)
          if (error?.response && error.response.status === 403) {
            // Remove token and userData synchronously and navigate via window.location to ensure navigation
            localStorage.removeItem("userToken")
            localStorage.removeItem("userData")
            // use replace so user cannot go back to protected page
            window.location.replace("/login")
          }
        } catch (e) {
          // swallow any errors here to avoid blocking rejection
          console.error(e)
        }
        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [])
}
