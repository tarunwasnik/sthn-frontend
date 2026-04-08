// frontend/src/api/public.ts

import api from "./axios";

/* ========= TYPES ========= */

export type HomeDTO = {
  stats: {
    totalCreators: number;
    totalBookings: number;
    totalUsers: number;
  };
  featuredCategories: {
    id: string;
    name: string;
    iconUrl: string;
  }[];
  featuredCreators: CreatorPublicCardDTO[];
};

export type CreatorPublicCardDTO = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  age: number | null;

  primaryCategory: string;

  rating: number | null;
  reviewCount: number;

  city?: string | null;
  country?: string | null;

  languages?: string[];

  startingPrice: number;
  currency: string;

  isAvailable: boolean;

  nextAvailableSlot?: string | null;
};

export type CreatorListingResponseDTO = {
  data: CreatorPublicCardDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/* ========= SERVICE TYPE ========= */

export type CreatorServiceDTO = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
};

export type CreatorPublicProfileDTO = {
  id: string;
  slug: string;

  displayName: string;
  avatarUrl: string | null;

  age: number | null;

  bio: string;

  categories: string[];
  primaryCategory: string;

  rating: number | null;
  reviewCount: number;

  languages: string[];

  city: string;
  country: string;

  currency: string;

  services: CreatorServiceDTO[];
};

/* ========= API ========= */

export const fetchHome = async (): Promise<HomeDTO> => {
  const { data } = await api.get("/public/home");
  return data;
};

export const fetchCreators = async (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  country?: string;
  city?: string;
  language?: string;
}): Promise<CreatorListingResponseDTO> => {

  const { data } = await api.get("/public/creators", {
    params,
  });

  return data;
};

export const fetchCreatorProfile = async (
  slug: string
): Promise<CreatorPublicProfileDTO> => {

  const { data } = await api.get(`/public/creators/${slug}`);
  return data;
};