export interface Computer {
  id: number;
  name: string;
  zone: 'Standard' | 'VIP';
  cpu: string;
  gpu: string;
  ram: string;
  price_per_hour: number;
  status: 'available' | 'occupied' | 'reserved';
}

export interface Booking {
  id: number;
  computer_id: number;
  computer_name: string;
  user_name: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'paid' | 'cancelled';
  total_price: number;
  created_at: string;
  zone?: string;
  cpu?: string;
  gpu?: string;
  ram?: string;
}
