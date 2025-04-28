export interface ContactForm {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface ContactFormResponse {
  success: boolean;
  message: string | null;
  data: ContactForm[];
} 