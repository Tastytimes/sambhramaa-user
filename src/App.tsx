import type React from "react"
import { useApiErrorHandler } from "./hooks/useApiErrorHandler"
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { Redirect, Route } from "react-router-dom"
import { Provider } from "react-redux"
import { store } from "./store/store"

import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import ResetPassword from "./pages/ResetPassword"
import Dashboard from "./pages/Dashboard"
import ChangePasswordPage from "./pages/ChangePasswordPage"
import AddressesPage from "./pages/AddressesPage"
import SelectLocationPage from "./pages/SelectLocationPage"
import AddAddressPage from "./pages/AddAddressPage"
import EditAddressPage from "./pages/EditAddressPage"
import SelectAddressPage from "./pages/SelectAddressPage"
import RestaurantDetails from "./pages/RestaurantDetails"

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css"

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css"
import "@ionic/react/css/structure.css"
import "@ionic/react/css/typography.css"

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css"
import "@ionic/react/css/float-elements.css"
import "@ionic/react/css/text-alignment.css"
import "@ionic/react/css/text-transformation.css"
import "@ionic/react/css/flex-utils.css"
import "@ionic/react/css/display.css"

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css"

/* Theme variables */
import "./theme/variables.css"
import FavoritesPage from "./pages/FavoritesPage"
import OrderProcessingPage from "./pages/OrderProcessingPage"
import OrdersHistoryPage from "./pages/OrdersHistoryPage"
import OrderDetailsPage from "./pages/OrderDetailsPage"
import CoinsPage from "./pages/CoinsPage"

setupIonicReact()


const App: React.FC = () => {
  useApiErrorHandler(); // Global 403 handler
  return (
    <Provider store={store}>
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/signup">
              <SignUp />
            </Route>
            <Route exact path="/reset-password">
              <ResetPassword />
            </Route>
            <Route path="/dashboard" component={Dashboard} />
            <Route exact path="/change-password">
              <ChangePasswordPage />
            </Route>
            <Route exact path="/addresses">
              <AddressesPage />
            </Route>
            <Route exact path="/select-location">
              <SelectLocationPage />
            </Route>
            <Route exact path="/add-address">
              <AddAddressPage />
            </Route>
            <Route exact path="/edit-address/:id">
              <EditAddressPage />
            </Route>
            <Route exact path="/select-address">
              <SelectAddressPage />
            </Route>
            <Route exact path="/restaurant-details/:outletId">
              <RestaurantDetails />
            </Route>
            <Route exact path="/order-processing/:orderId">
              <OrderProcessingPage />
            </Route>
            <Route exact path="/orders-history">
              <OrdersHistoryPage />
            </Route>
            <Route exact path="/orders-history/details/:orderId">
              <OrderDetailsPage />
            </Route>
            <Route exact path="/favorites">
              <FavoritesPage />
            </Route>
            <Route exact path="/coins">
              <CoinsPage />
            </Route>
            <Route exact path="/">
              <Redirect to="/dashboard" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </Provider>
  );
}

export default App
