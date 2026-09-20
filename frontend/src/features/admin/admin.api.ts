import { apiRequest } from '../../api/client';
export type ReviewStatus='PENDING'|'APPROVED'|'REJECTED'|'SUSPENDED';
export interface SpecialistReview {id:string;name:string;email:string;phone:string|null;active:boolean;approvedAt:string|null;rejectedAt:string|null;rejectionReason:string|null;createdAt:string;profile?:{specialty:string;professionalLicense:string;specialtyLicense:string|null;clinicName:string|null;clinicPhone:string|null;clinicAddress:string|null};}
export interface SpecialistList {data:SpecialistReview[];pagination:{page:number;limit:number;total:number;totalPages:number}}
export const listSpecialists=(status:ReviewStatus)=>apiRequest<SpecialistList>(`/admin/specialists?status=${status}`);
export const approveSpecialist=(id:string)=>apiRequest(`/admin/specialists/${id}/approve`,{method:'POST'});
export const rejectSpecialist=(id:string,reason:string)=>apiRequest(`/admin/specialists/${id}/reject`,{method:'POST',body:JSON.stringify({reason})});
export const suspendSpecialist=(id:string)=>apiRequest(`/admin/specialists/${id}/suspend`,{method:'POST'});
