-- Add service_id and total_flx_earned to deployed_instances
ALTER TABLE public.deployed_instances
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services (id),
ADD COLUMN IF NOT EXISTS total_flx_earned DECIMAL(18, 10) DEFAULT 0;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_deployed_instances_service_id ON public.deployed_instances (service_id);