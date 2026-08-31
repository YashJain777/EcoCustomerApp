/**
 * @file api.ts
 * @layer Core / Types
 * @responsibility Data Transfer Objects (DTOs) for all Customer App APIs.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// 1. Auth DTOs
export interface SendOtpRequest {
  mobile: string;
  purpose?: string;
}

export interface SendOtpResponse {
  message?: string;
  sent?: boolean;
  devHint?: string;
  expiresInSeconds?: number;
}

export interface VerifyOtpRequest {
  mobile: string;
  code: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  mobile: string;
}

export interface RegisterCustomerRequest {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  cityId?: string;
  pinCode?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  roles?: string[];
}

export interface GeneralVerifyOtpRequest {
  mobile: string;
  code: string;
  otpCode?: string;
}

export interface GeneralVerifyOtpResponse {
  token?: string;
  accessToken?: string;
  rawRefreshToken?: string;
  user: CustomerUser;
}

// 2. Profile & Address DTOs
export interface CustomerProfile {
  id: string;
  userId?: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  pinCode?: string;
  profilePic?: string;
  city?: {
    id: string;
    name: string;
    stateId?: string;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  address?: string;
  cityId?: string;
  pinCode?: string;
  profilePic?: string;
}

// 3. Dashboard DTOs
export interface DashboardStats {
  totalProducts?: number;
  activeBookings?: number;
  openComplaints?: number;
  activeAmcCount?: number;

  // Backend API properties
  totalRegisteredProducts?: number;
  warrantyProducts?: number;
  activeServices?: number;
  pendingServices?: number;
  completedServices?: number;
  notificationsCount?: number;
}

export interface DashboardProductSummary {
  id: string;
  productName: string;
  serialNumber: string;
  warrantyExpiryDate: string;
  warrantyStatus: string;
}

export interface DashboardRecentBooking {
  id: string;
  status: string;
  serviceType: string;
  shopkeeperName: string;
  scheduledAt: string;
}

export interface CustomerDashboardData {
  stats?: DashboardStats;
  totalRegisteredProducts?: number;
  warrantyProducts?: number;
  activeServices?: number;
  pendingServices?: number;
  completedServices?: number;
  notificationsCount?: number;
  myProductsSummary?: DashboardProductSummary[];
  recentBookings?: DashboardRecentBooking[];
}

// 4. Product / Appliance DTOs
export interface CustomerProductWarranty {
  id: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface CustomerProductInstallation {
  id: string;
  status: string;
  scheduledAt?: string;
  mechanicName?: string;
}

export interface CustomerProductServiceHistoryItem {
  id: string;
  status: string;
  createdAt: string;
  mechanicName?: string;
  serviceType?: string;
}

export interface CustomerProduct {
  id: string;
  productModelId?: string;
  productName: string;
  brandName?: string;
  categoryName?: string;
  categoryId?: string;
  productImage?: string;
  qrCode?: string;
  qrCodeId?: string;
  purchaseDate?: string;
  invoiceNumber?: string;
  saleId?: string;
  shopkeeperName?: string;
  shopkeeperMobile?: string;
  shopkeeperId?: string;
  unitPrice?: number;
  quantity?: number;
  warrantyMonths?: number;
  warranty?: CustomerProductWarranty;
  installation?: CustomerProductInstallation;
  serviceHistory?: CustomerProductServiceHistoryItem[];
  // Legacy / Fallback properties
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  warrantyExpiryDate?: string;
  status?: 'ACTIVE' | 'EXPIRED' | string;
}



export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  active?: boolean;
  productCount?: number;
}

export interface PaginatedCategories {
  items: ProductCategory[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ServiceTypeItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  categoryId?: string;
  active?: boolean;
  basePrice?: number;
  estimatedDuration?: string;
}

export interface ScanQrRequest {
  code: string;
  qrCode?: string;
}

export interface ScanQrResponse {
  id?: string;
  saleItemId?: string;
  qrCode?: string;
  status?: string;
  registered?: boolean;
  productName?: string;
  purchaseDate?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  warrantyExpiry?: string;
  warrantyMonths?: number;
  product?: {
    id: string;
    name: string;
    brand: string;
    category?: string | null;
  };
}

// 5. Booking DTOs
export interface AvailableShop {
  id: string;
  shopName: string;
  rating?: number;
  serviceArea?: string;
  offeredPrice?: number;
  distanceKm?: number;
  isAvailable?: boolean;
}

export interface AvailableMechanic {
  id: string;
  name: string;
  rating?: number;
  specialization?: string;
  experienceYears?: number;
  offeredPrice?: number;
  distanceKm?: number;
  isAvailable?: boolean;
}

export interface CreateBookingRequest {
  shopkeeperId?: string;
  serviceTypeId?: string;
  complaintTypeId?: string;
  saleItemId?: string;
  categoryId?: string;
  description: string;
  agreedPrice?: number;
  scheduledAt?: string;
}

export interface DirectFreelancerBookingRequest {
  mechanicId: string;
  serviceTypeId: string;
  complaintTypeId?: string;
  description: string;
  scheduledAt?: string;
  saleItemId?: string;
  categoryId?: string;
  preferredTimeSlot?: string;
  attachmentUrls?: string[];
  priority?: string;
}

export interface RescheduleBookingRequest {
  scheduledAt: string;
}

export interface BookingDetails {
  id: string;
  status: 'PENDING' | 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  description: string;
  scheduledAt?: string;
  createdAt?: string;
  agreedPrice?: number;
  serviceType?: {
    id: string;
    name: string;
  };
  shopkeeper?: {
    id: string;
    shopName: string;
  };
  assignedMechanicId?: string;
  bookingId?: string;
  jobId?: string;
}

// 6. Complaint DTOs
export interface RaiseComplaintRequest {
  saleItemId: string;
  complaintTypeId?: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ServicePartReplaced {
  id: string;
  partName: string;
  quantity: number;
  cost: number;
  totalCost: number;
}

export interface ServiceVisitLog {
  id: string;
  createdAt?: string;
  status?: string;
  notes?: string | null;
  cost?: number;
  otpVerified?: boolean;
  mechanicName?: string;
  partsReplaced?: ServicePartReplaced[];
}

export interface ServiceInvoiceBreakdown {
  invoiceNumber: string;
  issueDate?: string;
  baseLaborCost: number;
  partsTotalCost: number;
  totalInvoiceAmount: number;
  isWarrantyCovered: boolean;
  paymentStatus: 'PAID' | 'DUE' | 'PENDING' | 'CANCELLED' | string;
}

export interface ComplaintTicket {
  id: string;
  ticketNumber?: string;
  title?: string;
  appliance?: string;
  productName?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'OPEN' | 'PENDING_ACCEPTANCE' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'COMPLETED' | 'CANCELLED' | string;
  priority?: string;
  description?: string;
  cleanDescription?: string;
  rawDescription?: string;
  preferredSlot?: string | null;
  isWarranty?: boolean;
  warrantyType?: 'WARRANTY' | 'NON_WARRANTY' | string;
  agreedPrice?: number | null;
  assignedMechanicName?: string | null;
  shopkeeperName?: string;
  complaintType?: { id: string; name: string };
  serviceType?: { id: string; name: string; categoryId?: string };
  shopkeeper?: {
    id: string;
    shopName?: string;
    ownerName?: string;
    gstNumber?: string | null;
    mobile?: string | null;
    email?: string | null;
  } | null;
  customer?: {
    id: string;
    fullName?: string | null;
    mobile?: string | null;
    address?: string | null;
  } | null;
  saleItem?: {
    id?: string;
    productName?: string;
    productModel?: any;
    warranty?: any;
  } | null;
  pricing?: {
    agreedPrice?: number | null;
    isFreeService?: boolean;
  };
  invoice?: ServiceInvoiceBreakdown | null;
  visits?: ServiceVisitLog[];
}

// 7. AMC DTOs
export interface AmcPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  visitsIncluded: number;
  freeSpares: boolean;
}

export interface BuyAmcRequest {
  amcPlanId: string;
}

export interface AmcSubscription {
  id: string;
  name?: string;
  planName?: string;
  appliance?: string;
  applianceName?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  amount?: string | number;
  status: 'ACTIVE' | 'EXPIRED' | string;
  amcPlan?: {
    id: string;
    name: string;
    price: number;
  };
}

// 8. Notification DTOs
export interface NotificationItem {
  id: string;
  userId?: string;
  templateId?: string | null;
  channel?: 'PUSH' | 'IN_APP' | 'SMS' | 'EMAIL' | string;
  title: string;
  subtitle?: string;
  body?: string;
  message?: string;
  status?: 'SENT' | 'DELIVERED' | 'READ' | string;
  type?: 'JOB' | 'ALERT' | 'INSTALLATION' | 'SYSTEM' | 'PROMO' | string;
  jobId?: string;
  complaintId?: string;
  installationId?: string;
  meta?: {
    title?: string;
    data?: {
      complaintId?: string;
      jobId?: string;
      installationId?: string;
      type?: string;
      status?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  createdAt?: string;
  time?: string;
  read?: boolean;
  isRead?: boolean;
  iconName?: string;
  category?: string;
}

// 9. Support Inquiry DTO
export interface SupportQueryRequest {
  name?: string;
  mobile?: string;
  email?: string;
  subject: string;
  message: string;
}

// 10. Product Document Vault DTO
export interface ProductDocument {
  id: string;
  url: string;
  type?: 'INVOICE' | 'WARRANTY_CARD' | 'USER_MANUAL' | 'INSTALLATION_RECEIPT' | 'PRODUCT_DOC' | string;
  mime?: string;
  entityType?: string;
  entityId?: string;
  createdAt?: string;
  updatedAt?: string;
}

