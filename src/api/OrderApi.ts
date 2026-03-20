import axios, { AxiosResponse } from "axios";
import api from "./BaseApi";
import { AddToCartPayload, CreateOrderPayload } from "../constants/interface";
// import { AddToCartPayload, CreateOrderPayload } from "@/constants/interface";

export const OrdersApi = {
  toggleFaviourites: async (outletId: string): Promise<AxiosResponse> => {
    try {
      const response = await api.get(
        `/user-service/profile/favorite?outletId=${outletId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  getAllFaviorites: async (): Promise<AxiosResponse> => {
    try {
      const response = await api.get("/user-service/profile/get/favorite");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  addToCart: async (payload: AddToCartPayload): Promise<AxiosResponse> => {
    try {
      const response = await api.post(
        "/user-service/user/cart/addOrUpdate",
        payload
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },

  getCartItems: async (): Promise<AxiosResponse> => {
    try {
      const response = await api.get("/user-service/user/cart/get-items");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  createOrder: async (payload: CreateOrderPayload): Promise<AxiosResponse> => {
    try {
      const resp = await api.post("/user-service/user/order/create", payload);
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  getOrderStatus: async (orderId: string): Promise<AxiosResponse> => {
    try {
      const resp = await api.get(`/user-service/user/order/status/${orderId}`);
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
//   removeFromCart: async (foodItemId: string) => {
//     try {
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         throw new Error(error.response?.data?.message || "Login failed");
//       }
//       throw error;
//     }
//   },
  applyPromoCode: async (promocodeId: string) => {
    try {
      const resp = await api.get(
        `/user-service/user/order/status/${promocodeId}`
      );
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },

  getAllOrdersHistory: async (page: number, limit: number): Promise<AxiosResponse> => {
    try {
      const response = await api.get(`/user-service/user/order/all?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Failed to fetch orders");
      }
      throw error;
    }
  },

  getOrderDetails: async (orderId: string): Promise<AxiosResponse> => {
    try {
      const response = await api.get(`user-service/user/order/detail/${orderId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Failed to fetch order details");
      }
      throw error;
    }
  },
  downloadInvoice: async (orderId: string): Promise<Blob> => {
   const res = await api.get(`/user-service/orders/invoice/${orderId}`, {
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
      },
    })
    return res.data
  },
};