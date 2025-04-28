export interface Rating {
  id: number;
  reservationId: number;
  serviceTitle: string;
  userFullName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RatingResponse {
  success: boolean;
  message: string | null;
  data: Rating[];
} 