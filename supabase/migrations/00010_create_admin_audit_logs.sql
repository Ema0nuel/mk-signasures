-- Migration: 00010_create_admin_audit_logs.sql
-- Description: Create admin_audit_logs table for tracking admin actions

CREATE TABLE public.admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_audit_logs IS 'Tracks all admin actions for accountability. action format: entity.verb (e.g., product.create, order.update_status).';
