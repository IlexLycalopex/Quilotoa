-- Custom SQL migration file, put your code below! --

CREATE TYPE "role" AS ENUM('BDE', 'PRE_SALES', 'TEAM_LEAD', 'DIRECTOR', 'ADMIN');
CREATE TYPE "stage" AS ENUM('QUALIFICATION', 'DISCOVERY', 'COI', 'ROI', 'COMPLETE');
CREATE TYPE "solution" AS ENUM('SAGE_X3', 'SAGE_INTACCT', 'X3CLOUDDOCS', 'MIXED');
CREATE TYPE "document_type" AS ENUM('COI_SUMMARY', 'ROI_BUSINESS_CASE', 'DISCOVERY_SUMMARY');
CREATE TYPE "budget_status" AS ENUM('CONFIRMED', 'INDICATIVE', 'UNKNOWN');
CREATE TYPE "size_band" AS ENUM('SME', 'MID', 'ENTERPRISE');
CREATE TYPE "production_model" AS ENUM('MTO', 'MTS', 'ETO');
CREATE TYPE "migration_scope" AS ENUM('FULL', 'PARTIAL', 'NONE');
CREATE TYPE "it_readiness" AS ENUM('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "proposal_status" AS ENUM('DRAFT', 'FINAL');

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(63) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "config" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "role" "role" NOT NULL,
  "team_id" uuid REFERENCES "teams"("id") ON DELETE SET NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_tenant_idx" ON "users" ("tenant_id", "email");
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" ("tenant_id");

CREATE TABLE IF NOT EXISTS "organisations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "sector" varchar(100),
  "size_band" "size_band",
  "country" varchar(100),
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "orgs_tenant_idx" ON "organisations" ("tenant_id");

CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "org_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "stage" "stage" NOT NULL DEFAULT 'QUALIFICATION',
  "solution" "solution",
  "solution_override_reason" text,
  "meddpicc_score" integer,
  "bant_pass" boolean,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "opps_tenant_owner_idx" ON "opportunities" ("tenant_id", "owner_id");
CREATE INDEX IF NOT EXISTS "opps_tenant_stage_idx" ON "opportunities" ("tenant_id", "stage");

CREATE TABLE IF NOT EXISTS "bant_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL UNIQUE REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "budget_status" "budget_status" NOT NULL,
  "authority_identified" boolean NOT NULL,
  "authority_role" varchar(255),
  "need_statement" text NOT NULL,
  "need_category" varchar(100),
  "timeline_date" varchar(10),
  "pass" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "meddpicc_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL UNIQUE REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "metrics_score" integer NOT NULL DEFAULT 0,
  "metrics_notes" text,
  "economic_buyer_score" integer NOT NULL DEFAULT 0,
  "economic_buyer_name" varchar(255),
  "economic_buyer_role" varchar(255),
  "economic_buyer_engagement" varchar(100),
  "decision_criteria_score" integer NOT NULL DEFAULT 0,
  "decision_criteria_notes" text,
  "decision_process_score" integer NOT NULL DEFAULT 0,
  "decision_process_notes" text,
  "paper_process_score" integer NOT NULL DEFAULT 0,
  "paper_process_notes" text,
  "pain_score" integer NOT NULL DEFAULT 0,
  "pain_notes" text,
  "champion_score" integer NOT NULL DEFAULT 0,
  "champion_name" varchar(255),
  "champion_role" varchar(255),
  "competition_score" integer NOT NULL DEFAULT 0,
  "competition_notes" text,
  "total_score" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "discovery_datasets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL UNIQUE REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "current_erp" varchar(255),
  "go_live_target" varchar(10),
  "finance_team_size" integer,
  "month_end_days_actual" double precision,
  "multi_entity" boolean,
  "multi_currency" boolean,
  "reporting_requirements" text,
  "production_model" "production_model",
  "bom_complexity" varchar(50),
  "mrp_used" boolean,
  "shop_floor_capture" boolean,
  "warehouse_count" integer,
  "has_3pl" boolean,
  "edi_required" boolean,
  "project_types" text,
  "billing_models" text,
  "revenue_recognition" varchar(100),
  "has_subscription_billing" boolean,
  "arr_tracking_needed" boolean,
  "asc606_required" boolean,
  "fund_accounting" boolean,
  "grant_tracking" boolean,
  "matter_billing" boolean,
  "integration_count" integer,
  "migration_scope" "migration_scope",
  "api_edi_required" boolean,
  "it_readiness" "it_readiness",
  "change_sponsor_identified" boolean,
  "budget_range" varchar(100),
  "board_approval_required" boolean,
  "procurement_process" text,
  "solution_recommended" "solution",
  "solution_confirmed" boolean NOT NULL DEFAULT false,
  "solution_override_reason" text,
  "completion_pct" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "financial_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL UNIQUE REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "finance_team_size" integer,
  "finance_annual_salary" double precision,
  "manual_reentry_hrs_per_week_per_fte" double precision,
  "month_end_days_actual" double precision,
  "error_rework_pct" double precision,
  "audit_prep_days" double precision,
  "reporting_cycle_days" double precision,
  "it_legacy_annual_cost" double precision,
  "annual_transaction_volume" integer,
  "coi_manual_reentry" double precision,
  "coi_month_end" double precision,
  "coi_rework" double precision,
  "coi_audit" double precision,
  "coi_reporting" double precision,
  "coi_it_legacy" double precision,
  "coi_total_annual" double precision,
  "implementation_investment" double precision,
  "annual_licence_cost" double precision,
  "benefit_realisation_months" integer DEFAULT 6,
  "discount_rate_pct" double precision DEFAULT 8,
  "sensitivity_low_multiplier" double precision DEFAULT 0.7,
  "sensitivity_high_multiplier" double precision DEFAULT 1.3,
  "roi_payback_months" double precision,
  "roi_3yr_pct" double precision,
  "roi_npv" double precision,
  "roi_annual_benefit" double precision,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "document_type" "document_type" NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "status" "proposal_status" NOT NULL DEFAULT 'DRAFT',
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "pdf_path" varchar(500),
  "snapshot_data" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "proposals_opp_type_idx" ON "proposals" ("opportunity_id", "document_type");
