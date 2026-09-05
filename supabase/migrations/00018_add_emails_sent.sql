-- Migration: 00018_add_emails_sent.sql
-- Description: Add emails_sent flag to orders to prevent duplicate email sends

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS emails_sent BOOLEAN NOT NULL DEFAULT false;
