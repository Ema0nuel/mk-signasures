-- Migration: 00002_create_users_profiles.sql
-- Description: Create user_profiles and user_addresses tables

CREATE TABLE public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  role          public.user_role NOT NULL DEFAULT 'customer',
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_profiles IS 'Extends auth.users with app-specific profile data. Created automatically via trigger on auth.users insert.';
COMMENT ON COLUMN public.user_profiles.role IS 'Role-based access: customer (default), admin, super_admin';
COMMENT ON COLUMN public.user_profiles.metadata IS 'Flexible JSON field for additional user data (preferences, onboarding state, etc.)';

CREATE TABLE public.user_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Home',
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'Nigeria',
  postal_code   TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_addresses IS 'Saved delivery addresses per user.';
