/**
 * @file amc.types.ts
 * @layer Core / Types
 * @responsibility Type definitions for Annual Maintenance Contract (AMC) plans, subscriptions, and visits.
 */

export interface AmcCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  image?: string;
}

export interface AmcMechanicUser {
  fullName: string;
  mobile?: string;
}

export interface AmcMechanic {
  id: string;
  userId?: string;
  user?: AmcMechanicUser;
  shopName?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm?: number;
  distanceKm?: number;
}

export interface LocalAmcPlan {
  id: string;
  mechanicId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  durationMonths: number;
  visitsIncluded: number;
  coverageDetails?: string | string[];
  terms?: string;
  active?: boolean;
  category?: AmcCategory;
  mechanic?: AmcMechanic;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmcVisit {
  id: string;
  amcPurchaseId?: string;
  visitDate?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  mechanicNotes?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface MyAmcPlan {
  id: string;
  customerId: string;
  amcPlanId: string;
  mechanicId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'INITIATED' | 'SUCCESS';
  transactionId?: string;
  amcPlan?: LocalAmcPlan;
  mechanic?: AmcMechanic;
  visits?: AmcVisit[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchLocalPlansFilters {
  lat?: number;
  lng?: number;
  categoryId?: string;
}

export interface PurchaseAmcRequest {
  amcPlanId: string;
  paymentMode?: 'CARD' | 'UPI' | 'CASH';
}

export interface VerifyAmcPaymentRequest {
  purchaseId: string;
  transactionId: string;
}
