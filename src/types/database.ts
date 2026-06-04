// GymFlow — Database Types (keep in sync with Supabase schema)

// ── Enums ─────────────────────────────────────────────────────────────────────

export type ProfileRole = "OWNER" | "STAFF" | "RECEPTIONIST";
export type MemberStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
export type MembershipStatus = "ACTIVO" | "VENCIDO" | "PAUSADO" | "CANCELADO";
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "MERCADOPAGO" | "TARJETA";
export type PaymentStatus = "PAGADO" | "PENDIENTE" | "VENCIDO" | "PARCIAL";
export type NotificationType =
  | "PAGO_PROXIMO"
  | "PAGO_VENCIDO"
  | "PAGO_CONFIRMADO"
  | "MEMBRESIA_VENCIDA"
  | "BIENVENIDA"
  | "ACCESO_DENEGADO";

// ── Table row types ───────────────────────────────────────────────────────────

export interface Gym {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
  mercadopago_access_token: string | null;
  mercadopago_public_key: string | null;
  working_hours: WorkingHours | null;
  created_at: string;
}

export interface WorkingHours {
  lunes: { open: string; close: string; closed: boolean };
  martes: { open: string; close: string; closed: boolean };
  miercoles: { open: string; close: string; closed: boolean };
  jueves: { open: string; close: string; closed: boolean };
  viernes: { open: string; close: string; closed: boolean };
  sabado: { open: string; close: string; closed: boolean };
  domingo: { open: string; close: string; closed: boolean };
}

export interface Profile {
  id: string; // matches auth.users.id
  gym_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: ProfileRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  join_date: string;
  status: MemberStatus;
  notes: string | null;
  qr_code: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  access_days: number[] | null; // 0=Dom, 1=Lun, ..., 6=Sab — null = todos
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  gym_id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  paused_at: string | null;
  pause_days_used: number;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  membership_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  period_start: string | null;
  period_end: string | null;
  status: PaymentStatus;
  receipt_url: string | null;
  notes: string | null;
  mp_payment_id: string | null;
  created_at: string;
}

export interface AccessLog {
  id: string;
  gym_id: string;
  member_id: string;
  entry_time: string;
  exit_time: string | null;
  access_granted: boolean;
  denial_reason: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  gym_id: string;
  user_id: string | null;
  member_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ── Insert / Update helpers ───────────────────────────────────────────────────

export type MemberInsert = Omit<Member, "id" | "created_at" | "updated_at">;
export type MemberUpdate = Partial<MemberInsert>;
export type PlanInsert = Omit<Plan, "id" | "created_at">;
export type PlanUpdate = Partial<PlanInsert>;
export type MembershipInsert = Omit<Membership, "id" | "created_at">;
export type MembershipUpdate = Partial<MembershipInsert>;
export type PaymentInsert = Omit<Payment, "id" | "created_at">;
export type PaymentUpdate = Partial<PaymentInsert>;
export type AccessLogInsert = Omit<AccessLog, "id" | "created_at">;
export type NotificationInsert = Omit<Notification, "id" | "created_at">;

// ── Supabase Database generic type ───────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      gyms: { Row: Gym; Insert: Partial<Gym>; Update: Partial<Gym> };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      members: { Row: Member; Insert: MemberInsert; Update: MemberUpdate };
      plans: { Row: Plan; Insert: PlanInsert; Update: PlanUpdate };
      memberships: { Row: Membership; Insert: MembershipInsert; Update: MembershipUpdate };
      payments: { Row: Payment; Insert: PaymentInsert; Update: PaymentUpdate };
      access_logs: { Row: AccessLog; Insert: AccessLogInsert; Update: never };
      notifications: { Row: Notification; Insert: NotificationInsert; Update: Partial<NotificationInsert> };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      profile_role: ProfileRole;
      member_status: MemberStatus;
      membership_status: MembershipStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

// ── Joined types ──────────────────────────────────────────────────────────────

export interface MemberWithMembership extends Member {
  memberships: (Membership & { plan: Plan })[];
}

export interface MembershipWithDetails extends Membership {
  member: Member;
  plan: Plan;
  payments: Payment[];
}

export interface PaymentWithDetails extends Payment {
  member: Member;
  membership: (Membership & { plan: Plan }) | null;
}

export interface AccessLogWithMember extends AccessLog {
  member: Member;
}
