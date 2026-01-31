-- Rollback: Restore Age Verification, DigiLocker, and API Setu Module
-- Description: Restores all tables, columns, and constraints related to age verification
-- Use this only if you need to rollback the removal migration

BEGIN;

-- 1. Restore age_verification_sessions table
CREATE TABLE IF NOT EXISTS public.age_verification_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    widget_id character varying NOT NULL,
    visitor_id character varying NOT NULL,
    session_id character varying NOT NULL UNIQUE,
    state_token character varying NOT NULL UNIQUE,
    status character varying NOT NULL DEFAULT 'pending'::character varying 
        CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in_progress'::character varying, 'verified'::character varying, 'failed'::character varying, 'expired'::character varying]::text[])),
    digilocker_request_id character varying,
    digilocker_authorization_code character varying,
    verified_age integer,
    document_type character varying,
    consent_artifact_ref character varying,
    ip_address character varying,
    user_agent text,
    return_url text,
    initiated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    verified_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    code_verifier text,
    verification_outcome text CHECK (verification_outcome IS NULL OR (verification_outcome = ANY (ARRAY['verified_adult'::text, 'blocked_minor'::text, 'guardian_required'::text, 'guardian_approved'::text, 'limited_access'::text, 'expired'::text]))),
    CONSTRAINT age_verification_sessions_pkey PRIMARY KEY (id)
);

-- 2. Restore meripehchaan_consent_artefacts table
CREATE TABLE IF NOT EXISTS public.meripehchaan_consent_artefacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    acknowledgement_id character varying NOT NULL UNIQUE,
    subject_id character varying NOT NULL,
    status character varying NOT NULL DEFAULT 'granted'::character varying 
        CHECK (status::text = ANY (ARRAY['granted'::character varying, 'denied'::character varying, 'revoked'::character varying, 'expired'::character varying]::text[])),
    consent_timestamp timestamp with time zone NOT NULL,
    valid_until timestamp with time zone,
    scopes ARRAY,
    data_categories ARRAY,
    raw_jwt text NOT NULL,
    claims jsonb NOT NULL,
    age_verification_session_id uuid,
    ip_address character varying,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT meripehchaan_consent_artefacts_pkey PRIMARY KEY (id),
    CONSTRAINT meripehchaan_consent_artefacts_age_verification_session_id_fkey 
        FOREIGN KEY (age_verification_session_id) REFERENCES public.age_verification_sessions(id)
);

-- 3. Add columns back to dpdpa_widget_configs
ALTER TABLE IF EXISTS public.dpdpa_widget_configs 
    ADD COLUMN IF NOT EXISTS enable_age_gate boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS age_gate_threshold integer DEFAULT 18 
        CHECK (age_gate_threshold >= 13 AND age_gate_threshold <= 21),
    ADD COLUMN IF NOT EXISTS age_gate_minor_message text 
        DEFAULT 'This content requires adult supervision. Please ask a parent or guardian to assist you.',
    ADD COLUMN IF NOT EXISTS require_age_verification boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS age_verification_threshold integer DEFAULT 18 
        CHECK (age_verification_threshold >= 13 AND age_verification_threshold <= 21),
    ADD COLUMN IF NOT EXISTS age_verification_provider character varying DEFAULT 'digilocker',
    ADD COLUMN IF NOT EXISTS minor_handling character varying DEFAULT 'block',
    ADD COLUMN IF NOT EXISTS minor_guardian_message text 
        DEFAULT 'You must have parental consent to proceed. We will send a verification request to your guardian.',
    ADD COLUMN IF NOT EXISTS verification_validity_days integer DEFAULT 365 
        CHECK (verification_validity_days >= 1 AND verification_validity_days <= 365);

-- 4. Add check constraint for age_verification_provider
ALTER TABLE IF EXISTS public.dpdpa_widget_configs 
    ADD CONSTRAINT dpdpa_widget_configs_age_verification_provider_check 
        CHECK (age_verification_provider::text = ANY (ARRAY['digilocker'::character varying, 'apisetu'::character varying, 'custom'::character varying]::text[]));

-- 5. Add age_verification_id column back to dpdpa_consent_records
ALTER TABLE IF EXISTS public.dpdpa_consent_records 
    ADD COLUMN IF NOT EXISTS age_verification_id uuid;

-- 6. Add foreign key constraint back
ALTER TABLE IF EXISTS public.dpdpa_consent_records 
    ADD CONSTRAINT fk_consent_age_verification 
        FOREIGN KEY (age_verification_id) REFERENCES public.age_verification_sessions(id);

COMMIT;
