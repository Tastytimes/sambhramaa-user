import axios from "axios";
import api from "./BaseApi";
import { AddressRequestPayload, successResponse } from "../constants/interface";
// import { AddressRequestPayload, successResponse } from "@/constants/interface";

export const addressApi = {
  addAddress: async (
    payload: AddressRequestPayload
  ): Promise<successResponse> => {
    try {
      const resp = await api.post("/user-service/profile/add/address", payload);
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  getAllAddress: async (): Promise<successResponse> => {
    try {
      const resp = await api.get("/user-service/profile/get-all-address");
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  getAddressById: async (id: string): Promise<successResponse> => {
    try {
      const resp = await api.get(`/user-service/profile/address/get/${id}`);
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
  updateAddress: async (
    id: string,
    payload: AddressRequestPayload
  ): Promise<successResponse> => {
    try {
      const response = await api.put(
        `/user-service//profile/address/update/${id}`,
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
  deleteAddress: async (id: string): Promise<successResponse> => {
    try {
      const resp = await api.delete(
        `/user-service/profile/address/delete/${id}`
      );
      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  },
};