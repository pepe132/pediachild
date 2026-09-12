export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'PEDIATRICIAN';
  profile?: { specialty: string; professionalLicense: string; specialtyLicense: string | null; clinicName: string | null; clinicPhone: string | null; clinicAddress: string | null };
}
