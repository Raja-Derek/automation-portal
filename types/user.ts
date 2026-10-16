// Tipe user & peran untuk sistem hak akses.

export type UserRole = "admin" | "user";

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

/** Payload yang disimpan di dalam JWT session. */
export interface SessionPayload {
  id: string;
  email: string;
  role: UserRole;
}
