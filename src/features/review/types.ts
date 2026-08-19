export interface SubmitReviewPayload {
  rating: number;
  comment?: string;
  reportFlag?: boolean;
}

export interface ReviewDto {
  reviewId: string;
  rating: number;
  comment?: string;
  reportFlag?: boolean;
  createdAt: string;
}

export interface BookingReviewState {
  hasReviewed: boolean;
  review: ReviewDto | null;
}

export interface SubmitReviewResponse {
  message: string;
  review: ReviewDto;
}
