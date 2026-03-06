-- Migration: Setup Atomic Rate Limiting for API routes
-- Description: Creates a rate_limits table and an RPC function for atomic upsert & checking with strict permissions.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    request_count INTEGER DEFAULT 1
);

-- Index for cleanup optimization
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- 2. Enable Row Level Security (RLS) for security best practices
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Note: No RLS policies are needed for the anon role because 
-- the API route interacts with this table using the service_role key, 
-- which inherently bypasses RLS.

-- 3. Create the atomic RPC function
-- This function checks the rate limit, increments the counter atomically via UPSERT (ON CONFLICT),
-- and performs a lightweight random cleanup to prevent table growth over time.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    client_ip TEXT,
    max_requests INTEGER,
    window_minutes INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public -- Hardened search path
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- 1. Minimalistic Cleanup (runs ~5% of the time) to prevent table bloat
    -- Deletes records where the window has expired AND it's not the current active window.
    IF random() < 0.05 THEN
        DELETE FROM public.rate_limits 
        WHERE window_start < NOW() - (window_minutes || ' minutes')::interval;
    END IF;

    -- 2. Atomic Upsert Logic
    INSERT INTO public.rate_limits (ip, window_start, request_count)
    VALUES (client_ip, NOW(), 1)
    ON CONFLICT (ip) DO UPDATE
    SET 
        -- If the current stored window_start is older than the allowed timeframe, reset it.
        request_count = CASE 
            WHEN public.rate_limits.window_start < NOW() - (window_minutes || ' minutes')::interval THEN 1
            ELSE public.rate_limits.request_count + 1
        END,
        window_start = CASE 
            WHEN public.rate_limits.window_start < NOW() - (window_minutes || ' minutes')::interval THEN NOW()
            ELSE public.rate_limits.window_start
        END
    RETURNING request_count INTO current_count;

    -- 3. Check limit
    IF current_count > max_requests THEN
        RETURN TRUE;  -- Blocked (HTTP 429)
    ELSE
        RETURN FALSE; -- Allowed
    END IF;
END;
$$;

-- 4. Harden Execution Permissions
-- By default, functions might be executable by PUBLIC. We lock it down strictly.
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;
