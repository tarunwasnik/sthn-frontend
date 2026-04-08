export type HomeSummaryDTO = {
  stats: {
    totalCreators: number;
    totalBookings: number;
    activeCategories: number;
  };
  featuredCreators: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    age: number | null;
    primaryCategory: string;
    rating: number | null;
    reviewCount: number;
  }[];
  categories: {
    id: string;
    label: string;
  }[];
};