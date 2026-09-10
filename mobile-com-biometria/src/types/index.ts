export type Role = 'DRIVER' | 'FLEET_MANAGER' | 'HR' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: Role;
  tenantId: string;
  branchName: string;
  biometricEnrolled: boolean;
  biometricVector?: number[];
}

export interface AssignedVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  currentMileage: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
}

export interface ClockingRecord {
  id: string;
  type: 'IN' | 'OUT' | 'LUNCH_OUT' | 'LUNCH_IN';
  timestamp: string;
  facialVerified: boolean;
  matchScore: number;
}
