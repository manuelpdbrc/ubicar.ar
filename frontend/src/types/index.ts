/* ===================================================
   ubicar.ar — TypeScript Interfaces
   =================================================== */

// ---- Enums ----

export type GlobalRole = 'USER' | 'ADMIN';
export type CollectionRole = 'CREATOR' | 'EDITOR' | 'VIEWER';
export type VisitType = 'SPONTANEOUS' | 'CIRCUIT';
export type CircuitStatus = 'PENDING' | 'PENDING_EXPIRED' | 'COMPLETED';

// ---- Models ----

export interface User {
  id: number;
  name: string;
  email: string;
  globalRole: GlobalRole;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  createdByUserId: number;
  createdAt?: string;
}

export interface Location {
  id: number;
  uniqueCode: string;
  name: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  categoryId: number;
  category?: Category;
  createdByUserId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdByUserId: number;
  createdAt?: string;
  updatedAt?: string;
  locations?: CollectionLocation[];
  permissions?: CollectionPermission[];
  _count?: { locations: number };
}

export interface CollectionLocation {
  collectionId: number;
  locationId: number;
  addedAt?: string;
  location?: Location;
}

export interface CollectionPermission {
  collectionId: number;
  userId: number;
  role: CollectionRole;
  user?: User;
}

export interface Visit {
  id: number;
  clientId: string | null;
  locationId: number;
  location?: Location;
  userId: number;
  user?: User;
  dateTimestamp: string;
  comment: string | null;
  imageUrl: string | null;
  type: VisitType;
  circuitId: number | null;
  circuit?: Circuit;
}

export interface Circuit {
  id: number;
  name: string;
  collectionId: number;
  collection?: Collection;
  assignedOperatorId: number;
  assignedOperator?: User;
  requestedDate: string;
  expirationDate: string;
  status: CircuitStatus;
  createdAt?: string;
  updatedAt?: string;
  visits?: Visit[];
  _count?: { visits: number };
}

// ---- API Responses ----

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ---- Offline ----

export interface OfflineVisit {
  id?: number;
  clientId: string;
  locationUniqueCode: string;
  comment: string | null;
  imageBlob: Blob | null;
  type: VisitType;
  circuitId: number | null;
  createdAt: string;
}
