export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'passenger' | 'driver' | 'admin';
  loyalty_points: number;
  is_blocked: boolean;
  profile_image?: string;
  created_at: string;
}

export interface DriverDetails {
  driver_id: string;
  national_id: string;
  phone: string;
  car_plate: string;
  vehicle_type: string;
  license_url: string;
  car_reg_url: string;
  id_url: string;
  criminal_url: string;
  profile_photo_url: string;
  is_approved: boolean;
  current_status: 'تحت المراجعة' | 'نشط' | 'موقوف' | 'مرفوض';
  driver_number: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  address_text: string;
  coords: { x: number; y: number };
  created_at: string;
}

export interface Wallet {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'إيداع' | 'سحب' | 'رحلة';
  description: string;
  created_at: string;
}

export interface Coupon {
  code: string;
  discount_amount: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface AdminContent {
  key: string;
  value: string;
  updated_at: string;
}

export interface DriverLocation {
  driver_id: string;
  coords: { x: number; y: number };
  last_updated: string;
}

export type RideStatus = 'searching' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';

export interface Ride {
  id: string;
  passenger_id: string;
  driver_id?: string;
  status: RideStatus;
  pickup_address: string;
  pickup_coords: { x: number; y: number };
  dropoff_address: string;
  dropoff_coords: { x: number; y: number };
  fare: number;
  distance_km: number;
  duration_minutes?: number;
  vehicle_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  driver?: DriverDetails;
}

export interface Activity extends Ride {
  // Activities mirror rides according to schema script
}
