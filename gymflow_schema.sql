-- =============================================================================
-- GymFlow - Supabase (PostgreSQL) Database Schema
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- gyms
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gyms (
    id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                       TEXT        NOT NULL,
    logo_url                   TEXT,
    address                    TEXT,
    phone                      TEXT,
    timezone                   TEXT        NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    currency                   TEXT        NOT NULL DEFAULT 'ARS',
    mercadopago_access_token   TEXT,
    mercadopago_public_key     TEXT,
    working_hours              JSONB       NOT NULL DEFAULT '{
        "monday":    {"open": "07:00", "close": "22:00", "enabled": true},
        "tuesday":   {"open": "07:00", "close": "22:00", "enabled": true},
        "wednesday": {"open": "07:00", "close": "22:00", "enabled": true},
        "thursday":  {"open": "07:00", "close": "22:00", "enabled": true},
        "friday":    {"open": "07:00", "close": "22:00", "enabled": true},
        "saturday":  {"open": "08:00", "close": "14:00", "enabled": true},
        "sunday":    {"open": "08:00", "close": "12:00", "enabled": false}
    }',
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- profiles (mirrors auth.users, one row per user)
-- -----------------------------------------------------------------------------
CREATE TYPE public.profile_role AS ENUM ('OWNER', 'STAFF', 'RECEPTIONIST');

CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID         PRIMARY KEY,   -- same as auth.users.id
    gym_id       UUID         REFERENCES public.gyms (id) ON DELETE SET NULL,
    first_name   TEXT         NOT NULL DEFAULT '',
    last_name    TEXT         NOT NULL DEFAULT '',
    email        TEXT         NOT NULL,
    role         public.profile_role NOT NULL DEFAULT 'STAFF',
    avatar_url   TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT profiles_email_unique UNIQUE (email)
);

-- -----------------------------------------------------------------------------
-- members
-- -----------------------------------------------------------------------------
CREATE TYPE public.member_status AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

CREATE TABLE IF NOT EXISTS public.members (
    id                       UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id                   UUID               NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
    first_name               TEXT               NOT NULL,
    last_name                TEXT               NOT NULL,
    dni                      TEXT,
    birth_date               DATE,
    email                    TEXT,
    phone                    TEXT,
    address                  TEXT,
    photo_url                TEXT,
    emergency_contact_name   TEXT,
    emergency_contact_phone  TEXT,
    join_date                DATE               NOT NULL DEFAULT CURRENT_DATE,
    status                   public.member_status NOT NULL DEFAULT 'ACTIVO',
    notes                    TEXT,
    qr_code                  TEXT               UNIQUE DEFAULT gen_random_uuid()::TEXT,
    deleted_at               TIMESTAMPTZ,       -- soft delete
    created_at               TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- plans
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id         UUID        NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
    name           TEXT        NOT NULL,
    description    TEXT,
    price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    duration_days  INTEGER     NOT NULL CHECK (duration_days > 0),
    -- e.g. ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
    access_days    JSONB       NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- memberships
-- -----------------------------------------------------------------------------
CREATE TYPE public.membership_status AS ENUM ('ACTIVO', 'VENCIDO', 'PAUSADO', 'CANCELADO');

CREATE TABLE IF NOT EXISTS public.memberships (
    id               UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id           UUID                     NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
    member_id        UUID                     NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
    plan_id          UUID                     NOT NULL REFERENCES public.plans (id) ON DELETE RESTRICT,
    start_date       DATE                     NOT NULL DEFAULT CURRENT_DATE,
    end_date         DATE                     NOT NULL,
    status           public.membership_status NOT NULL DEFAULT 'ACTIVO',
    paused_at        TIMESTAMPTZ,
    pause_days_used  INTEGER                  NOT NULL DEFAULT 0,
    notes            TEXT,
    created_at       TIMESTAMPTZ              NOT NULL DEFAULT NOW(),

    CONSTRAINT memberships_dates_check CHECK (end_date >= start_date)
);

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
CREATE TYPE public.payment_method AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'MERCADOPAGO', 'TARJETA');
CREATE TYPE public.payment_status  AS ENUM ('PAGADO', 'PENDIENTE', 'VENCIDO', 'PARCIAL');

CREATE TABLE IF NOT EXISTS public.payments (
    id             UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id         UUID                   NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
    member_id      UUID                   NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
    membership_id  UUID                   REFERENCES public.memberships (id) ON DELETE SET NULL,
    amount         NUMERIC(10,2)          NOT NULL CHECK (amount >= 0),
    payment_date   DATE                   NOT NULL DEFAULT CURRENT_DATE,
    payment_method public.payment_method  NOT NULL DEFAULT 'EFECTIVO',
    period_start   DATE,
    period_end     DATE,
    status         public.payment_status  NOT NULL DEFAULT 'PAGADO',
    receipt_url    TEXT,
    notes          TEXT,
    mp_payment_id  TEXT,                  -- MercadoPago external ID
    created_at     TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- access_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID        NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
    member_id       UUID        NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
    entry_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_time       TIMESTAMPTZ,
    access_granted  BOOLEAN     NOT NULL DEFAULT TRUE,
    denial_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id     UUID        NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
    user_id    UUID        REFERENCES public.profiles (id) ON DELETE CASCADE,
    member_id  UUID        REFERENCES public.members (id) ON DELETE CASCADE,
    type       TEXT        NOT NULL,   -- e.g. 'membership_expiring', 'payment_due', 'access_denied'
    title      TEXT        NOT NULL,
    message    TEXT        NOT NULL,
    read       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- INDEXES
-- =============================================================================

-- gyms
CREATE INDEX IF NOT EXISTS idx_gyms_created_at        ON public.gyms (created_at DESC);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_gym_id        ON public.profiles (gym_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email         ON public.profiles (email);

-- members
CREATE INDEX IF NOT EXISTS idx_members_gym_id         ON public.members (gym_id);
CREATE INDEX IF NOT EXISTS idx_members_dni            ON public.members (dni);
CREATE INDEX IF NOT EXISTS idx_members_email          ON public.members (email);
CREATE INDEX IF NOT EXISTS idx_members_status         ON public.members (gym_id, status);
CREATE INDEX IF NOT EXISTS idx_members_deleted_at     ON public.members (deleted_at) WHERE deleted_at IS NULL;

-- plans
CREATE INDEX IF NOT EXISTS idx_plans_gym_id           ON public.plans (gym_id);
CREATE INDEX IF NOT EXISTS idx_plans_active           ON public.plans (gym_id, is_active) WHERE is_active = TRUE;

-- memberships
CREATE INDEX IF NOT EXISTS idx_memberships_gym_id     ON public.memberships (gym_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id  ON public.memberships (member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_plan_id    ON public.memberships (plan_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status     ON public.memberships (gym_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date   ON public.memberships (gym_id, end_date);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_gym_id        ON public.payments (gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id     ON public.payments (member_id);
CREATE INDEX IF NOT EXISTS idx_payments_membership_id ON public.payments (membership_id);
CREATE INDEX IF NOT EXISTS idx_payments_date          ON public.payments (gym_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON public.payments (gym_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_mp_id         ON public.payments (mp_payment_id) WHERE mp_payment_id IS NOT NULL;

-- access_logs
CREATE INDEX IF NOT EXISTS idx_access_logs_gym_id     ON public.access_logs (gym_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_member_id  ON public.access_logs (member_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_entry_time ON public.access_logs (gym_id, entry_time DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_gym_id   ON public.notifications (gym_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON public.notifications (gym_id, user_id, read) WHERE read = FALSE;


-- =============================================================================
-- TRIGGER: updated_at on members
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- TRIGGER: auto-create profile on auth.users insert
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name',  ''),
        COALESCE(
            (NEW.raw_user_meta_data ->> 'role')::public.profile_role,
            'STAFF'
        )
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Attach trigger to Supabase auth schema
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Helper function: returns the gym_id that belongs to the calling user.
-- Stored as SECURITY DEFINER so it can read profiles without RLS loops.
CREATE OR REPLACE FUNCTION public.auth_gym_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT gym_id
    FROM   public.profiles
    WHERE  id = auth.uid()
    LIMIT  1;
$$;

-- ---- gyms ----
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY gyms_select ON public.gyms
    FOR SELECT
    TO authenticated
    USING (id = public.auth_gym_id());

CREATE POLICY gyms_update ON public.gyms
    FOR UPDATE
    TO authenticated
    USING (id = public.auth_gym_id())
    WITH CHECK (id = public.auth_gym_id());

-- Only a service-role or seed script inserts a gym; adjust if you allow self-signup.
CREATE POLICY gyms_insert ON public.gyms
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- ---- profiles ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id() OR id = auth.uid());

CREATE POLICY profiles_insert ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (gym_id = public.auth_gym_id())
    WITH CHECK (gym_id = public.auth_gym_id());

-- ---- members ----
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select ON public.members
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id());

CREATE POLICY members_insert ON public.members
    FOR INSERT
    TO authenticated
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY members_update ON public.members
    FOR UPDATE
    TO authenticated
    USING (gym_id = public.auth_gym_id())
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY members_delete ON public.members
    FOR DELETE
    TO authenticated
    USING (gym_id = public.auth_gym_id());

-- ---- plans ----
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_select ON public.plans
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id());

CREATE POLICY plans_insert ON public.plans
    FOR INSERT
    TO authenticated
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY plans_update ON public.plans
    FOR UPDATE
    TO authenticated
    USING (gym_id = public.auth_gym_id())
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY plans_delete ON public.plans
    FOR DELETE
    TO authenticated
    USING (gym_id = public.auth_gym_id());

-- ---- memberships ----
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY memberships_select ON public.memberships
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id());

CREATE POLICY memberships_insert ON public.memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY memberships_update ON public.memberships
    FOR UPDATE
    TO authenticated
    USING (gym_id = public.auth_gym_id())
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY memberships_delete ON public.memberships
    FOR DELETE
    TO authenticated
    USING (gym_id = public.auth_gym_id());

-- ---- payments ----
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select ON public.payments
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id());

CREATE POLICY payments_insert ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY payments_update ON public.payments
    FOR UPDATE
    TO authenticated
    USING (gym_id = public.auth_gym_id())
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY payments_delete ON public.payments
    FOR DELETE
    TO authenticated
    USING (gym_id = public.auth_gym_id());

-- ---- access_logs ----
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_logs_select ON public.access_logs
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id());

CREATE POLICY access_logs_insert ON public.access_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (gym_id = public.auth_gym_id());

-- access_logs are immutable (no UPDATE / DELETE policies)

-- ---- notifications ----
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON public.notifications
    FOR SELECT
    TO authenticated
    USING (gym_id = public.auth_gym_id());

CREATE POLICY notifications_insert ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY notifications_update ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (gym_id = public.auth_gym_id() AND (user_id = auth.uid() OR user_id IS NULL))
    WITH CHECK (gym_id = public.auth_gym_id());

CREATE POLICY notifications_delete ON public.notifications
    FOR DELETE
    TO authenticated
    USING (gym_id = public.auth_gym_id());


-- =============================================================================
-- SEED DATA
-- =============================================================================

DO $$
DECLARE
    v_gym_id          UUID := '00000000-0000-0000-0000-000000000001';
    v_plan_mensual    UUID := '00000000-0000-0000-0000-000000000010';
    v_plan_trimestral UUID := '00000000-0000-0000-0000-000000000011';
    v_plan_anual      UUID := '00000000-0000-0000-0000-000000000012';

    v_member1         UUID := '00000000-0000-0000-0000-000000000101';
    v_member2         UUID := '00000000-0000-0000-0000-000000000102';
    v_member3         UUID := '00000000-0000-0000-0000-000000000103';
    v_member4         UUID := '00000000-0000-0000-0000-000000000104';
    v_member5         UUID := '00000000-0000-0000-0000-000000000105';

    v_ms1             UUID := '00000000-0000-0000-0000-000000000201';
    v_ms2             UUID := '00000000-0000-0000-0000-000000000202';
    v_ms3             UUID := '00000000-0000-0000-0000-000000000203';
    v_ms4             UUID := '00000000-0000-0000-0000-000000000204';
    v_ms5             UUID := '00000000-0000-0000-0000-000000000205';
BEGIN

    -- ------------------------------------------------------------------
    -- Gym
    -- ------------------------------------------------------------------
    INSERT INTO public.gyms (id, name, address, phone, timezone, currency)
    VALUES (
        v_gym_id,
        'GymFlow Centro',
        'Av. Corrientes 1234, Buenos Aires, Argentina',
        '+54 11 4567-8901',
        'America/Argentina/Buenos_Aires',
        'ARS'
    )
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------
    -- Plans
    -- ------------------------------------------------------------------
    INSERT INTO public.plans (id, gym_id, name, description, price, duration_days, access_days, is_active)
    VALUES
        (
            v_plan_mensual,
            v_gym_id,
            'Plan Mensual',
            'Acceso ilimitado todos los días del mes.',
            5000.00,
            30,
            '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
            TRUE
        ),
        (
            v_plan_trimestral,
            v_gym_id,
            'Plan Trimestral',
            'Acceso ilimitado por 3 meses con descuento.',
            13000.00,
            90,
            '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
            TRUE
        ),
        (
            v_plan_anual,
            v_gym_id,
            'Plan Anual',
            'Acceso ilimitado todo el año al mejor precio.',
            45000.00,
            365,
            '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
            TRUE
        )
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------
    -- Members
    -- ------------------------------------------------------------------
    INSERT INTO public.members (id, gym_id, first_name, last_name, dni, birth_date, email, phone, join_date, status)
    VALUES
        (v_member1, v_gym_id, 'Lucas',    'Fernández',  '30123456', '1990-03-15', 'lucas.fernandez@email.com',  '+54 11 1111-0001', '2024-01-10', 'ACTIVO'),
        (v_member2, v_gym_id, 'Valentina','Gómez',      '32654321', '1995-07-22', 'valentina.gomez@email.com',  '+54 11 1111-0002', '2024-02-01', 'ACTIVO'),
        (v_member3, v_gym_id, 'Martín',   'López',      '28987654', '1988-11-05', 'martin.lopez@email.com',     '+54 11 1111-0003', '2024-01-20', 'ACTIVO'),
        (v_member4, v_gym_id, 'Sofía',    'Rodríguez',  '35111222', '1998-05-30', 'sofia.rodriguez@email.com',  '+54 11 1111-0004', '2024-03-05', 'INACTIVO'),
        (v_member5, v_gym_id, 'Nicolás',  'Martínez',   '27333444', '1985-09-12', 'nicolas.martinez@email.com', '+54 11 1111-0005', '2023-11-15', 'ACTIVO')
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------
    -- Memberships
    -- ------------------------------------------------------------------
    INSERT INTO public.memberships (id, gym_id, member_id, plan_id, start_date, end_date, status)
    VALUES
        (v_ms1, v_gym_id, v_member1, v_plan_mensual,    '2026-06-01', '2026-06-30', 'ACTIVO'),
        (v_ms2, v_gym_id, v_member2, v_plan_trimestral, '2026-05-01', '2026-07-29', 'ACTIVO'),
        (v_ms3, v_gym_id, v_member3, v_plan_anual,      '2026-01-01', '2026-12-31', 'ACTIVO'),
        (v_ms4, v_gym_id, v_member4, v_plan_mensual,    '2026-04-01', '2026-04-30', 'VENCIDO'),
        (v_ms5, v_gym_id, v_member5, v_plan_trimestral, '2026-05-15', '2026-08-12', 'ACTIVO')
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------
    -- Payments
    -- ------------------------------------------------------------------
    INSERT INTO public.payments (
        gym_id, member_id, membership_id,
        amount, payment_date, payment_method,
        period_start, period_end, status
    )
    VALUES
        -- Lucas - mensual pagado en efectivo
        (v_gym_id, v_member1, v_ms1,  5000.00,  '2026-06-01', 'EFECTIVO',      '2026-06-01', '2026-06-30', 'PAGADO'),
        -- Valentina - trimestral por transferencia
        (v_gym_id, v_member2, v_ms2,  13000.00, '2026-05-01', 'TRANSFERENCIA', '2026-05-01', '2026-07-29', 'PAGADO'),
        -- Martín - cuota enero del anual
        (v_gym_id, v_member3, v_ms3,  45000.00, '2026-01-01', 'MERCADOPAGO',   '2026-01-01', '2026-12-31', 'PAGADO'),
        -- Sofía - mensual vencido (pago parcial)
        (v_gym_id, v_member4, v_ms4,  2500.00,  '2026-04-01', 'EFECTIVO',      '2026-04-01', '2026-04-30', 'PARCIAL'),
        -- Nicolás - trimestral con tarjeta
        (v_gym_id, v_member5, v_ms5,  13000.00, '2026-05-15', 'TARJETA',       '2026-05-15', '2026-08-12', 'PAGADO')
    ON CONFLICT DO NOTHING;

    -- ------------------------------------------------------------------
    -- Access logs (recent entries)
    -- ------------------------------------------------------------------
    INSERT INTO public.access_logs (gym_id, member_id, entry_time, exit_time, access_granted)
    VALUES
        (v_gym_id, v_member1, NOW() - INTERVAL '2 hours',  NOW() - INTERVAL '1 hour',   TRUE),
        (v_gym_id, v_member2, NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '2 hours',  TRUE),
        (v_gym_id, v_member3, NOW() - INTERVAL '1 day',    NOW() - INTERVAL '23 hours', TRUE),
        (v_gym_id, v_member5, NOW() - INTERVAL '5 hours',  NOW() - INTERVAL '4 hours',  TRUE),
        -- Sofía is INACTIVO - access denied
        (v_gym_id, v_member4, NOW() - INTERVAL '30 minutes', NULL, FALSE)
    ON CONFLICT DO NOTHING;

    -- ------------------------------------------------------------------
    -- Notifications
    -- ------------------------------------------------------------------
    INSERT INTO public.notifications (gym_id, member_id, type, title, message, read)
    VALUES
        (v_gym_id, v_member4, 'membership_expired',  'Membresía vencida',        'La membresía de Sofía Rodríguez venció el 30 de abril.',           FALSE),
        (v_gym_id, v_member1, 'payment_due',         'Pago próximo a vencer',    'Lucas Fernández tiene el pago del mes venciendo el 30 de junio.',  FALSE),
        (v_gym_id, v_member4, 'access_denied',       'Acceso denegado',          'Se denegó el acceso a Sofía Rodríguez por membresía inactiva.',    FALSE)
    ON CONFLICT DO NOTHING;

END $$;
