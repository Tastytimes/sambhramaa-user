"use client";

import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonSearchbar,
} from "@ionic/react";
import {
  heartOutline,
  heart,
  starOutline,
  timeOutline,
  filterOutline,
  arrowBackOutline,
  locationOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { COLORS } from "../theme/theme";
import CustomButton from "../components/CustomButton";
import { OrdersApi } from "../api/OrderApi";


interface ICuisine {
  name: string;
  _id: string;
}

interface FavoriteRestaurant {
  id: string;
  restaurantName: string;
  restaurantImage: string;
  outletName: string;
  cuisine: ICuisine[];
  rating: number;
  deliveryTime: string;
  distance?: string;
  deliveryFee?: number;
  minOrder?: number;
  isFavorite: boolean;
  isOpen?: boolean;
  offers?: string[];
}

interface ToastState {
  isOpen: boolean;
  message: string;
  color: "success" | "danger" | "warning" | "primary";
}

const FavoritesPage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<
    FavoriteRestaurant[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    color: "primary",
  });

  const navigate = useHistory();

  // Mock data - replace with actual API calls
  // const mockFavoriteRestaurants: FavoriteRestaurant[] = [
  //   {
  //     id: "1",
  //     restaurantName: "Pizza Palace",
  //     restaurantImage: "/placeholder.svg?height=160&width=300&text=Pizza+Palace",
  //     rating: 4.5,
  //     deliveryTime: "25-30 min",
  //     cuisine: ["Italian", "Pizza", "Fast Food"],
  //     distance: "2.1 km",
  //     deliveryFee: 29,
  //     minOrder: 199,
  //     isFavorite: true,
  //     isOpen: true,
  //     offers: ["50% OFF up to ₹100", "Free Delivery"],
  //   },
  //   {
  //     id: "2",
  //     name: "Burger House",
  //     image: "/placeholder.svg?height=160&width=300&text=Burger+House",
  //     rating: 4.2,
  //     deliveryTime: "20-25 min",
  //     cuisine: "American, Burgers, Beverages",
  //     distance: "1.8 km",
  //     deliveryFee: 25,
  //     minOrder: 149,
  //     isFavorite: true,
  //     isOpen: true,
  //     offers: ["Buy 1 Get 1 Free"],
  //   },
  //   {
  //     id: "3",
  //     name: "Sushi Zen",
  //     image: "/placeholder.svg?height=160&width=300&text=Sushi+Zen",
  //     rating: 4.7,
  //     deliveryTime: "35-40 min",
  //     cuisine: "Japanese, Sushi, Asian",
  //     distance: "3.2 km",
  //     deliveryFee: 35,
  //     minOrder: 299,
  //     isFavorite: true,
  //     isOpen: true,
  //     offers: ["20% OFF on orders above ₹500"],
  //   },
  //   {
  //     id: "4",
  //     name: "Spice Garden",
  //     image: "/placeholder.svg?height=160&width=300&text=Spice+Garden",
  //     rating: 4.4,
  //     deliveryTime: "30-35 min",
  //     cuisine: "Indian, North Indian, Biryani",
  //     distance: "2.5 km",
  //     deliveryFee: 30,
  //     minOrder: 199,
  //     isFavorite: true,
  //     isOpen: false,
  //     offers: ["₹125 OFF above ₹249"],
  //   },
  //   {
  //     id: "5",
  //     name: "Taco Bell",
  //     image: "/placeholder.svg?height=160&width=300&text=Taco+Bell",
  //     rating: 4.1,
  //     deliveryTime: "25-30 min",
  //     cuisine: "Mexican, Fast Food, Wraps",
  //     distance: "1.9 km",
  //     deliveryFee: 25,
  //     minOrder: 179,
  //     isFavorite: true,
  //     isOpen: true,
  //     offers: ["Flat ₹100 OFF"],
  //   },
  //   {
  //     id: "6",
  //     name: "Cafe Mocha",
  //     image: "/placeholder.svg?height=160&width=300&text=Cafe+Mocha",
  //     rating: 4.6,
  //     deliveryTime: "15-20 min",
  //     cuisine: "Cafe, Coffee, Desserts, Bakery",
  //     distance: "1.2 km",
  //     deliveryFee: 20,
  //     minOrder: 99,
  //     isFavorite: true,
  //     isOpen: true,
  //     offers: ["Buy 2 Get 1 Free on Coffees"],
  //   },
  // ]

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    filterFavorites();
  }, [favorites, searchText]);

  const loadFavorites = async (): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      const resp = await OrdersApi.getAllFaviorites();
      if (Array.isArray(resp.data)) {
        // setFavorites(resp.data as FavoriteRestaurant[])
        const favorites: FavoriteRestaurant[] = resp.data.map((item) => ({
          id: item.outletId,
          restaurantName: item.restaurantName,
          restaurantImage: item.restaurantImage,
          outletName: item.outletName,
          cuisine: item.cuisine.map((c: ICuisine) => c.name),
          rating: 4.5, // or use a real value if available
          deliveryTime: "30-40 min", // or use a real value if available
          distance: "", // or use a real value if available
          deliveryFee: 0, // or use a real value if available
          minOrder: 0, // or use a real value if available
          isFavorite: true,
          isOpen: item.outletStatus,
          offers: [], // or use a real value if available
        }));

        setFavorites(favorites);
      } else {
        throw new Error("Invalid response format");
      }
      // await new Promise((resolve) => setTimeout(resolve, 1000))
      // setFavorites(mockFavoriteRestaurants)
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(error.message, "danger");
      } else {
        showToast("Failed to load favorite restaurants", "danger");
      }
      showToast("Failed to load favorite restaurants", "danger");
    } finally {
      setLoading(false);
    }
  };

  const filterFavorites = (): void => {
    let filtered = favorites;

    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.restaurantName.toLowerCase().includes(searchText.toLowerCase()) ||
          restaurant.cuisine.some((c: ICuisine) =>
            c.name.toLowerCase().includes(searchText.toLowerCase())
          )
      );
    }

    setFilteredFavorites(filtered);
  };

  const showToast = (
    message: string,
    color: ToastState["color"] = "primary"
  ): void => {
    setToast({
      isOpen: true,
      message,
      color,
    });
  };

  const hideToast = (): void => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleFavorite = async (restaurantId: string): Promise<void> => {
    try {
      setLoading(true);
      // Find the restaurant to toggle
      const restaurant = favorites.find((r) => r.id === restaurantId);
      if (!restaurant) return;
      // Use the API's toggleFaviourites method
      await OrdersApi.toggleFaviourites(restaurantId);
      showToast(
        restaurant.isFavorite ? "Removed from favorites" : "Added to favorites",
        "success"
      );
      // Refresh favorites list from API and update filteredFavorites immediately
      const resp = await OrdersApi.getAllFaviorites();
      if (Array.isArray(resp.data)) {
        const newFavorites: FavoriteRestaurant[] = resp.data.map((item) => ({
          id: item.outletId,
          restaurantName: item.restaurantName,
          restaurantImage: item.restaurantImage,
          outletName: item.outletName,
          cuisine: Array.isArray(item.cuisine)
            ? item.cuisine.map((c: ICuisine) => (typeof c === "string" ? { name: c, _id: "" } : c))
            : [],
          rating: 4.5,
          deliveryTime: "30-40 min",
          distance: "",
          deliveryFee: 0,
          minOrder: 0,
          isFavorite: true,
          isOpen: item.outletStatus,
          offers: [],
        }));
        setFavorites(newFavorites);
        setFilteredFavorites(newFavorites.filter(
          (restaurant) =>
            restaurant.restaurantName.toLowerCase().includes(searchText.toLowerCase()) ||
            restaurant.cuisine.some((c: ICuisine) =>
              c.name.toLowerCase().includes(searchText.toLowerCase())
            )
        ));
      }
    } catch {
      showToast("Failed to update favorite status", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent): Promise<void> => {
    await loadFavorites();
    event.detail.complete();
  };

  const handleBackNavigation = (): void => {
    navigate.goBack();
  };

  const openRestaurant = (restaurant: FavoriteRestaurant): void => {
    showToast(`Opening ${restaurant.restaurantName}...`, "primary");
    // Navigate to restaurant details page
    navigate.push(`/restaurant/${restaurant.id}`);
  };

  const renderRestaurantCard = (
    restaurant: FavoriteRestaurant
  ): React.ReactElement => (
    <IonCard
      key={restaurant.id}
      style={{ margin: "8px 0", borderRadius: "12px", overflow: "hidden" }}
    >
      <div style={{ position: "relative" }}>
        <img
          src={restaurant.restaurantImage || "/placeholder.svg"}
          alt={restaurant.restaurantImage}
          style={{
            width: "100%",
            height: "160px",
            objectFit: "cover",
          }}
        />

        {/* Favorite Button */}
        <IonButton
          fill="clear"
          size="small"
          onClick={() => toggleFavorite(restaurant.id)}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            "--color": COLORS.error,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
          }}
        >
          <IonIcon icon={restaurant.isFavorite ? heart : heartOutline} />
        </IonButton>

        {/* Offers Badge */}
        {restaurant.offers && restaurant.offers.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "8px",
              backgroundColor: COLORS.primary,
              color: COLORS.white,
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
              maxWidth: "70%",
            }}
          >
            {restaurant.offers[0]}
          </div>
        )}

        {/* Closed Overlay */}
        {!restaurant.isOpen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IonText
              style={{
                color: COLORS.white,
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              CLOSED
            </IonText>
          </div>
        )}
      </div>

      <IonCardContent style={{ padding: "16px" }}>
        {/* Restaurant Name and Cuisine */}
        <div style={{ marginBottom: "8px" }}>
          <IonText>
            <h3
              style={{
                margin: "0 0 4px 0",
                color: COLORS.text,
                fontWeight: "600",
                fontSize: "18px",
              }}
            >
              {restaurant.restaurantName}
            </h3>
          </IonText>
          <IonText
            style={{ color: COLORS.gray, fontSize: "14px", lineHeight: "18px" }}
          >
            {Array.isArray(restaurant.cuisine)
              ? restaurant.cuisine.map((c) => typeof c === "string" ? c : c.name).join(", ")
              : ""}
          </IonText>
        </div>

        {/* Rating, Time, Distance */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: COLORS.success + "20",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            <IonIcon
              icon={starOutline}
              style={{
                fontSize: "14px",
                color: COLORS.success,
                marginRight: "4px",
              }}
            />
            <IonText
              style={{
                fontSize: "12px",
                color: COLORS.success,
                fontWeight: "600",
              }}
            >
              {restaurant.rating}
            </IonText>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <IonIcon
                icon={timeOutline}
                style={{ fontSize: "14px", color: COLORS.gray }}
              />
              <IonText style={{ fontSize: "12px", color: COLORS.gray }}>
                {restaurant.deliveryTime}
              </IonText>
            </div>

            {restaurant.distance && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <IonIcon
                  icon={locationOutline}
                  style={{ fontSize: "14px", color: COLORS.gray }}
                />
                <IonText style={{ fontSize: "12px", color: COLORS.gray }}>
                  {restaurant.distance}
                </IonText>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            padding: "8px 0",
            borderTop: `1px solid ${COLORS.lightGray}`,
          }}
        >
          <IonText style={{ fontSize: "12px", color: COLORS.gray }}>
            ₹{restaurant.deliveryFee} delivery fee
          </IonText>
          <IonText style={{ fontSize: "12px", color: COLORS.gray }}>
            Min order ₹{restaurant.minOrder}
          </IonText>
        </div>

        {/* Action Button */}
        <CustomButton
          fullWidth
          size="small"
          onClick={() => openRestaurant(restaurant)}
          disabled={!restaurant.isOpen}
          variant={restaurant.isOpen ? "solid" : "outline"}
        >
          {restaurant.isOpen ? "View Menu" : "Currently Closed"}
        </CustomButton>
      </IonCardContent>
    </IonCard>
  );

  const renderEmptyState = (): React.ReactElement => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        textAlign: "center",
      }}
    >
      <IonIcon
        icon={heartOutline}
        style={{
          fontSize: "80px",
          color: COLORS.gray,
          marginBottom: "24px",
        }}
      />
      <IonText>
        <h2
          style={{
            color: COLORS.text,
            margin: "0 0 12px 0",
            fontWeight: "600",
          }}
        >
          No Favorite Restaurants Yet
        </h2>
      </IonText>
      <IonText>
        <p
          style={{
            color: COLORS.gray,
            margin: "0 0 24px 0",
            lineHeight: "22px",
          }}
        >
          Start exploring and add your favorite restaurants here for quick
          access
        </p>
      </IonText>
      <CustomButton onClick={() => navigate.push("/dashboard/home")}>
        Explore Restaurants
      </CustomButton>
    </div>
  );

  const renderNoSearchResults = (): React.ReactElement => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <IonIcon
        icon={searchText ? filterOutline : heartOutline}
        style={{
          fontSize: "60px",
          color: COLORS.gray,
          marginBottom: "16px",
        }}
      />
      <IonText>
        <h3
          style={{
            color: COLORS.text,
            margin: "0 0 8px 0",
            fontWeight: "600",
          }}
        >
          No restaurants found
        </h3>
      </IonText>
      <IonText>
        <p
          style={{
            color: COLORS.gray,
            margin: 0,
            fontSize: "14px",
          }}
        >
          Try searching with different keywords
        </p>
      </IonText>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton
            fill="clear"
            slot="start"
            onClick={handleBackNavigation}
            style={{ color: "white" }}
          >
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle>Favorite Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search Bar */}
        <div style={{ padding: "16px 16px 8px 16px" }}>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search favorite restaurants..."
            showClearButton="focus"
            style={{
              "--background": COLORS.lightGray,
              "--border-radius": "12px",
              "--box-shadow": "none",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "0 16px 24px 16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <IonText style={{ color: COLORS.gray }}>
                Loading favorite restaurants...
              </IonText>
            </div>
          ) : favorites.length === 0 ? (
            renderEmptyState()
          ) : filteredFavorites.length === 0 ? (
            renderNoSearchResults()
          ) : (
            <div>
              {/* Results Count */}
              <div style={{ marginBottom: "16px" }}>
                <IonText style={{ color: COLORS.gray, fontSize: "14px" }}>
                  {filteredFavorites.length} favorite restaurant
                  {filteredFavorites.length !== 1 ? "s" : ""}{" "}
                  {searchText ? "found" : ""}
                </IonText>
              </div>

              {/* Restaurants List */}
              {filteredFavorites.map((restaurant) =>
                renderRestaurantCard(restaurant)
              )}
            </div>
          )}
        </div>

        {/* Toast Messages */}
        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={hideToast}
          message={toast.message}
          duration={2000}
          color={toast.color}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default FavoritesPage;
