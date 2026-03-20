"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonIcon,
  IonButton,
  IonSpinner,
  IonToast,
  IonAlert,
  IonItem,
  IonList,
} from "@ionic/react"
import { arrowBackOutline, locationOutline, navigateOutline, searchOutline } from "ionicons/icons"
import { useHistory, useLocation } from "react-router-dom"
import { Geolocation } from "@capacitor/geolocation"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import { COLORS } from "../theme/theme"
import CustomButton from "../components/CustomButton"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""

interface LocationCoordinates {
  latitude: number
  longitude: number
  latitudeDelta?: number
  longitudeDelta?: number
}

interface AddressDetails {
  formattedAddress: string
  streetNumber: string
  route: string
  locality: string
  city: string
  state: string
  country: string
  postalCode: string
}

interface ToastState {
  isOpen: boolean
  message: string
  color: "success" | "danger" | "warning" | "primary"
}

interface PlacePrediction {
  placeId: string
  mainText: string
  secondaryText: string
  description: string
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
}

const SelectLocationPage: React.FC = () => {
  const location = useLocation()
  const history = useHistory()
  const searchParams = new URLSearchParams(location.search)
  const navigationSource = searchParams.get("navigationSource")
  const fromScreen = searchParams.get("fromScreen")
  const initialLatitude = searchParams.get("initialLatitude")
  const initialLongitude = searchParams.get("initialLongitude")
  const addressId = searchParams.get("addressId")

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [coordinates, setCoordinates] = useState<LocationCoordinates>({
    latitude: initialLatitude ? Number.parseFloat(initialLatitude) : defaultCenter.lat,
    longitude: initialLongitude ? Number.parseFloat(initialLongitude) : defaultCenter.lng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  })
  const [address, setAddress] = useState<AddressDetails>({
    formattedAddress: "Loading...",
    streetNumber: "",
    route: "",
    locality: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  })
  const [permissionAlert, setPermissionAlert] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Autocomplete state
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const mapRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Initialize services when map is loaded
  useEffect(() => {
    if (isLoaded) {
      geocoderRef.current = new google.maps.Geocoder()
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
    }
  }, [isLoaded])

  // Initialize PlacesService when map is loaded
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    placesServiceRef.current = new google.maps.places.PlacesService(map)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      initializeLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  // Debounced search for autocomplete
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length < 2) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPredictions(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const fetchPredictions = async (input: string) => {
    if (!autocompleteServiceRef.current || !input.trim()) {
      setPredictions([])
      return
    }

    setIsSearching(true)

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: "in" }, // Restrict to India
        types: ["geocode", "establishment"],
      }

      autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
        setIsSearching(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedPredictions: PlacePrediction[] = results.map((prediction) => ({
            placeId: prediction.place_id,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text || "",
            description: prediction.description,
          }))
          setPredictions(formattedPredictions)
          setShowPredictions(true)
        } else {
          setPredictions([])
          setShowPredictions(false)
        }
      })
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setIsSearching(false)
      setPredictions([])
    }
  }

  const handlePredictionSelect = (prediction: PlacePrediction) => {
    setSearchQuery(prediction.description)
    setShowPredictions(false)
    setPredictions([])

    // Get place details to get coordinates
    if (placesServiceRef.current) {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.placeId,
        fields: ["geometry", "formatted_address", "address_components"],
      }

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          setCoordinates({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          })

          // Pan map to selected location
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng })
            mapRef.current.setZoom(17)
          }

          // Update address details
          if (place.address_components) {
            const getComponent = (type: string): string => {
              const component = place.address_components?.find((c) => c.types.includes(type))
              return component ? component.long_name : ""
            }

            setAddress({
              formattedAddress: place.formatted_address || prediction.description,
              streetNumber: getComponent("street_number"),
              route: getComponent("route"),
              locality: getComponent("sublocality_level_1") || getComponent("neighborhood"),
              city: getComponent("locality") || getComponent("administrative_area_level_2"),
              state: getComponent("administrative_area_level_1"),
              country: getComponent("country"),
              postalCode: getComponent("postal_code"),
            })
          } else {
            fetchAddressFromCoordinates(lat, lng)
          }
        }
      })
    } else {
      // Fallback to geocoder
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ placeId: prediction.placeId }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location
            const lat = location.lat()
            const lng = location.lng()

            setCoordinates({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            })

            if (mapRef.current) {
              mapRef.current.panTo({ lat, lng })
              mapRef.current.setZoom(17)
            }

            fetchAddressFromCoordinates(lat, lng)
          }
        })
      }
    }
  }

  const showToast = (message: string, color: ToastState["color"] = "primary"): void => {
    setToast({
      isOpen: true,
      message,
      color,
    })
  }

  const hideToast = (): void => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }

  const initializeLocation = async (): Promise<void> => {
    try {
      if (initialLatitude && initialLongitude) {
        await fetchAddressFromCoordinates(Number.parseFloat(initialLatitude), Number.parseFloat(initialLongitude))
      } else {
        await requestLocationPermission()
      }
    } catch (error) {
      console.error("Error initializing location:", error)
      setLoading(false)
      showToast("Error initializing location", "danger")
      await fetchAddressFromCoordinates(defaultCenter.lat, defaultCenter.lng)
    }
  }

  const requestLocationPermission = async (): Promise<void> => {
    try {
      const permissions = await Geolocation.requestPermissions()

      if (permissions.location === "granted") {
        await getCurrentLocation()
      } else {
        setLoading(false)
        setPermissionAlert(true)
        await fetchAddressFromCoordinates(defaultCenter.lat, defaultCenter.lng)
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
      setLoading(false)
      showToast("Error requesting location permission", "danger")
      await fetchAddressFromCoordinates(defaultCenter.lat, defaultCenter.lng)
    }
  }

  const getCurrentLocation = async (): Promise<void> => {
    try {
      setLoading(true)

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      })

      const { latitude, longitude } = position.coords

      setCoordinates({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      })

      if (mapRef.current) {
        mapRef.current.panTo({ lat: latitude, lng: longitude })
        mapRef.current.setZoom(17)
      }

      await fetchAddressFromCoordinates(latitude, longitude)
    } catch (error) {
      console.error("Error getting current location:", error)
      setLoading(false)
      showToast("Could not get your current location. Please ensure location services are enabled.", "warning")
      await fetchAddressFromCoordinates(defaultCenter.lat, defaultCenter.lng)
    }
  }

  const fetchAddressFromCoordinates = useCallback(async (latitude: number, longitude: number): Promise<void> => {
    try {
      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              const result = results[0]
              const components = result.address_components

              const getComponent = (type: string): string => {
                const component = components.find((c) => c.types.includes(type))
                return component ? component.long_name : ""
              }

              setAddress({
                formattedAddress: result.formatted_address,
                streetNumber: getComponent("street_number"),
                route: getComponent("route"),
                locality: getComponent("sublocality_level_1") || getComponent("neighborhood"),
                city: getComponent("locality") || getComponent("administrative_area_level_2"),
                state: getComponent("administrative_area_level_1"),
                country: getComponent("country"),
                postalCode: getComponent("postal_code"),
              })
            } else {
              setAddress({
                formattedAddress: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                streetNumber: "",
                route: "",
                locality: "",
                city: "",
                state: "",
                country: "",
                postalCode: "",
              })
            }
            setLoading(false)
          }
        )
      } else {
        setAddress({
          formattedAddress: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          streetNumber: "",
          route: "",
          locality: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
        })
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching address:", error)
      setAddress({
        formattedAddress: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        streetNumber: "",
        route: "",
        locality: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      })
      setLoading(false)
    }
  }, [])

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()

        setCoordinates({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        })

        fetchAddressFromCoordinates(lat, lng)
      }
    },
    [fetchAddressFromCoordinates]
  )

  const handleMarkerDragStart = () => {
    setIsDragging(true)
  }

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      setIsDragging(false)
      if (event.latLng) {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()

        setCoordinates({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        })

        fetchAddressFromCoordinates(lat, lng)
      }
    },
    [fetchAddressFromCoordinates]
  )

  const handleUseCurrentLocation = (): void => {
    setShowPredictions(false)
    getCurrentLocation()
  }

  const handleConfirmLocation = (): void => {
    if (fromScreen === "edit-address" && addressId) {
      history.push({
        pathname: `/edit-address/${addressId}`,
        search: `?newLatitude=${coordinates.latitude}&newLongitude=${coordinates.longitude}&newAddress=${encodeURIComponent(address.formattedAddress)}`,
      })
    } else {
      history.push({
        pathname: "/add-address",
        search: `?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&address=${encodeURIComponent(address.formattedAddress)}&navigationSource=${navigationSource || "select-address"}`,
      })
    }
  }

  const handleBackNavigation = (): void => {
    history.goBack()
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchInputFocus = () => {
    if (predictions.length > 0) {
      setShowPredictions(true)
    }
  }

  const handleSearchInputBlur = () => {
    // Delay hiding to allow click on prediction
    setTimeout(() => {
      setShowPredictions(false)
    }, 200)
  }

  if (loadError) {
    return (
      <IonPage>
        <IonContent>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              padding: "40px",
            }}
          >
            <IonText color="danger">Error loading Google Maps</IonText>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton fill="clear" slot="start" onClick={handleBackNavigation} style={{ color: "white" }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Select delivery location</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Search Bar with Autocomplete */}
        <div style={{ padding: "16px", backgroundColor: COLORS.white, zIndex: 1000, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: COLORS.lightGray,
                borderRadius: "12px",
                padding: "12px 16px",
                border: showPredictions ? `2px solid ${COLORS.primary}` : "2px solid transparent",
              }}
            >
              <IonIcon icon={searchOutline} style={{ fontSize: "20px", color: COLORS.gray, marginRight: "12px" }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={handleSearchInputFocus}
                onBlur={handleSearchInputBlur}
                placeholder="Search for a building, street name or area"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  fontSize: "16px",
                  color: COLORS.text,
                }}
              />
              {isSearching && (
                <IonSpinner name="crescent" color="primary" style={{ width: "20px", height: "20px" }} />
              )}
              {searchQuery && !isSearching && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => {
                    setSearchQuery("")
                    setPredictions([])
                    setShowPredictions(false)
                  }}
                  style={{ "--padding-start": "4px", "--padding-end": "4px" }}
                >
                  <IonIcon icon={arrowBackOutline} style={{ fontSize: "16px", transform: "rotate(180deg)" }} />
                </IonButton>
              )}
            </div>

            {/* Autocomplete Predictions Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: COLORS.white,
                  borderRadius: "12px",
                  marginTop: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  maxHeight: "300px",
                  overflowY: "auto",
                  zIndex: 1001,
                }}
              >
                <IonList style={{ padding: 0 }}>
                  {predictions.map((prediction, index) => (
                    <IonItem
                      key={prediction.placeId}
                      button
                      detail={false}
                      onClick={() => handlePredictionSelect(prediction)}
                      style={{
                        "--padding-start": "16px",
                        "--padding-end": "16px",
                        "--inner-padding-end": "0",
                        borderBottom: index < predictions.length - 1 ? `1px solid ${COLORS.lightGray}` : "none",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "18px",
                          backgroundColor: COLORS.lightGray,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon icon={locationOutline} style={{ fontSize: "18px", color: COLORS.gray }} />
                      </div>
                      <div style={{ flex: 1, paddingTop: "12px", paddingBottom: "12px" }}>
                        <IonText
                          style={{
                            display: "block",
                            fontWeight: "600",
                            fontSize: "15px",
                            color: COLORS.text,
                            marginBottom: "2px",
                          }}
                        >
                          {prediction.mainText}
                        </IonText>
                        <IonText
                          style={{
                            display: "block",
                            fontSize: "13px",
                            color: COLORS.gray,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {prediction.secondaryText}
                        </IonText>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: "relative", height: "calc(100vh - 280px)" }}>
          {!isLoaded || loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "40px",
                backgroundColor: COLORS.lightGray,
              }}
            >
              <IonSpinner name="crescent" color="primary" style={{ width: "40px", height: "40px" }} />
              <IonText style={{ marginTop: "16px", color: COLORS.gray, textAlign: "center" }}>
                Loading map...
              </IonText>
            </div>
          ) : (
            <>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: coordinates.latitude, lng: coordinates.longitude }}
                zoom={17}
                options={mapOptions}
                onLoad={handleMapLoad}
                onClick={handleMapClick}
              >
                <Marker
                  position={{ lat: coordinates.latitude, lng: coordinates.longitude }}
                  draggable={true}
                  onDragStart={handleMarkerDragStart}
                  onDragEnd={handleMarkerDragEnd}
                  animation={google.maps.Animation.DROP}
                />
              </GoogleMap>

              {/* Tooltip */}
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  maxWidth: "280px",
                  textAlign: "center",
                  zIndex: 10,
                }}
              >
                <IonText style={{ color: COLORS.white, fontSize: "14px", fontWeight: "600" }}>
                  {isDragging ? "Release to set location" : "Drag pin or tap to change location"}
                </IonText>
              </div>

              {/* Current Location Button */}
              <IonButton
                fill="solid"
                size="default"
                onClick={handleUseCurrentLocation}
                style={{
                  position: "absolute",
                  bottom: "20px",
                  right: "20px",
                  "--background": COLORS.white,
                  "--color": COLORS.primary,
                  "--border-radius": "25px",
                  "--box-shadow": "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: 10,
                }}
              >
                <IonIcon icon={navigateOutline} style={{ marginRight: "8px" }} />
                Use Current Location
              </IonButton>
            </>
          )}
        </div>

        {/* Address Container */}
        <div
          style={{
            backgroundColor: COLORS.white,
            padding: "16px",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            position: "relative",
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                backgroundColor: COLORS.primary + "20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <IonIcon
                icon={locationOutline}
                style={{
                  fontSize: "20px",
                  color: COLORS.primary,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <IonText>
                <h3
                  style={{
                    margin: "0 0 4px 0",
                    color: COLORS.text,
                    fontWeight: "600",
                    fontSize: "16px",
                  }}
                >
                  {address.locality || address.route || "Selected Location"}
                </h3>
              </IonText>
            </div>
          </div>

          <IonText
            style={{
              color: COLORS.gray,
              fontSize: "14px",
              lineHeight: "20px",
              display: "block",
              marginBottom: "16px",
            }}
          >
            {address.formattedAddress}
          </IonText>

          <CustomButton
            fullWidth
            size="large"
            onClick={handleConfirmLocation}
            disabled={
              loading ||
              address.formattedAddress === "Loading..." ||
              address.formattedAddress === "Error fetching address"
            }
          >
            Confirm Location
          </CustomButton>
        </div>

        {/* Permission Alert */}
        <IonAlert
          isOpen={permissionAlert}
          onDidDismiss={() => setPermissionAlert(false)}
          header="Location Permission"
          message="Location permission is required to use this feature. You can still manually select a location using the search bar."
          buttons={["OK"]}
        />

        {/* Toast Messages */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={hideToast}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="top"
        />
      </IonContent>
    </IonPage>
  )
}

export default SelectLocationPage
