import type { SessionUser } from "./auth";

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}

export function isSupervisor(user: SessionUser) {
  return user.role === "ATASAN" || user.role === "ADMIN";
}

/** Pemilik laporan, admin, atau atasan langsung pemilik boleh melihat. */
export function canViewReport(user: SessionUser, ownerId: string, ownerSupervisorId: string | null) {
  return user.id === ownerId || user.role === "ADMIN" || (user.role === "ATASAN" && ownerSupervisorId === user.id);
}

/** Hanya atasan langsung (atau admin) yang boleh meninjau laporan. */
export function canReviewReport(user: SessionUser, ownerId: string, ownerSupervisorId: string | null) {
  if (user.id === ownerId) return false;
  return user.role === "ADMIN" || (user.role === "ATASAN" && ownerSupervisorId === user.id);
}
