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
  collectionLocations?: CollectionLocation[];
  _count?: { visits: number };
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
  userRole?: string;
  _count?: { locations: number };
}

export interface CollectionLocation {
  collectionId: number;
  locationId: number;
  addedAt?: string;
  location?: Location;
}

export interface CollectionPermission {
  collectionId?: number;
  userId?: number;
  role: CollectionRole;
  user?: User;
  name?: string;
  email?: string;
  status?: 'pending' | 'accepted';
}

export interface VisitImage {
  id: number;
  imageUrl: string;
  createdAt: string;
}

export interface Visit {
  id: number;
  locationId: number;
  location?: Location;
  userId: number;
  user?: User;
  dateTimestamp: string;
  comment: string | null;
  formData?: any;
  type: VisitType;
  circuitId: number | null;
  circuit?: Circuit;
  images?: VisitImage[];
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


