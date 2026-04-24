export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  owner_name: string;
  make: string;
  model: string;
  color: string;
  insurance_company: string;
  insurance_expiry: string;
}

export interface Lookup {
  id: number;
  officer_id: number;
  plate_number: string;
  timestamp: string;
  make?: string;
  model?: string;
}

export interface Flag {
  id: number;
  plate_number: string;
  officer_id: number;
  officer_name: string;
  suspicion_notes: string;
  timestamp: string;
}
