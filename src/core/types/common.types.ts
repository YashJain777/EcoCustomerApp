export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface CustomerProfile {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  pinCode?: string;
  cityId?: string;
  city?: {
    id: string;
    name: string;
  };
}

export interface CustomerProduct {
  id: string;
  saleId?: string;
  qrCode?: string;
  productName: string;
  brand?: string;
  modelNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

export interface ServiceBooking {
  id: string;
  shopkeeperId?: string;
  serviceTypeId?: string;
  complaintTypeId?: string;
  saleItemId?: string;
  description: string;
  agreedPrice?: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  createdAt: string;
  shopkeeper?: {
    shopName: string;
    mobile?: string;
  };
}
