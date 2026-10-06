import type { Repository } from "typeorm";
import { AppError } from "../../shared/errors/app-error";
import { Session } from "../auth/session.entity";
import { User, UserRole } from "../auth/user.entity";
export interface AdminServiceContract {
  list(status: string, page: number, limit: number): Promise<unknown>;
  approve(adminId: string, id: string): Promise<unknown>;
  reject(adminId: string, id: string, reason: string): Promise<unknown>;
  suspend(adminId: string, id: string): Promise<unknown>;
}

export class AdminService implements AdminServiceContract {
  constructor(
    private users: Repository<User>,
    private sessions: Repository<Session>,
  ) {}
  async list(status: string, page: number, limit: number) {
    const q = this.users
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.profile", "profile")
      .where("user.role = :role", { role: UserRole.PEDIATRICIAN });
    if (status === "PENDING")
      q.andWhere("user.approvedAt IS NULL").andWhere("user.rejectedAt IS NULL");
    if (status === "APPROVED")
      q.andWhere("user.approvedAt IS NOT NULL").andWhere("user.active = true");
    if (status === "REJECTED") q.andWhere("user.rejectedAt IS NOT NULL");
    if (status === "SUSPENDED")
      q.andWhere("user.approvedAt IS NOT NULL").andWhere("user.active = false");
    const [data, total] = await q
      .orderBy("user.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data: data.map(publicSpecialist),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async approve(adminId: string, id: string) {
    const u = await this.specialist(id);
    if (!u.profile?.professionalLicense)
      throw new AppError(
        409,
        "LICENSE_REQUIRED",
        "La cuenta no tiene cédula profesional.",
      );
    Object.assign(u, {
      active: true,
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      reviewedBy: adminId,
    });
    return publicSpecialist(await this.users.save(u));
  }
  async reject(adminId: string, id: string, reason: string) {
    const u = await this.specialist(id);
    Object.assign(u, {
      active: false,
      approvedAt: null,
      rejectedAt: new Date(),
      rejectionReason: reason,
      reviewedBy: adminId,
    });
    await this.users.save(u);
    await this.sessions.delete({ userId: id });
    return publicSpecialist(u);
  }
  async suspend(adminId: string, id: string) {
    const u = await this.specialist(id);
    if (!u.approvedAt)
      throw new AppError(
        409,
        "ACCOUNT_NOT_APPROVED",
        "La cuenta todavía no está aprobada.",
      );
    u.active = false;
    u.reviewedBy = adminId;
    await this.users.save(u);
    await this.sessions.delete({ userId: id });
    return publicSpecialist(u);
  }
  private async specialist(id: string) {
    const u = await this.users.findOne({
      where: { id, role: UserRole.PEDIATRICIAN },
      relations: { profile: true },
    });
    if (!u)
      throw new AppError(
        404,
        "SPECIALIST_NOT_FOUND",
        "El especialista no existe.",
      );
    return u;
  }
}
function publicSpecialist(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    active: u.active,
    approvedAt: u.approvedAt,
    rejectedAt: u.rejectedAt,
    rejectionReason: u.rejectionReason,
    createdAt: u.createdAt,
    profile: u.profile,
  };
}
