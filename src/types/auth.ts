import type { UserRole } from "../models/user.model";

export interface AuthUser {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}