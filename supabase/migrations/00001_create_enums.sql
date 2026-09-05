-- Migration: 00001_create_enums.sql
-- Description: Create all enum types used across the database

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'successful',
  'failed',
  'refunded'
);

CREATE TYPE public.user_role AS ENUM (
  'customer',
  'admin',
  'super_admin'
);

CREATE TYPE public.product_status AS ENUM (
  'draft',
  'active',
  'archived',
  'out_of_stock'
);

CREATE TYPE public.image_processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);
