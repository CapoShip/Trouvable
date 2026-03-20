-- Colonnes audit_id pour lier opportunities / merge_suggestions à client_site_audits
-- Idempotent — à exécuter si la table a été créée sans ces colonnes.

ALTER TABLE public.opportunities
    ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL;

ALTER TABLE public.merge_suggestions
    ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_audit_id ON public.opportunities(audit_id);
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_audit_id ON public.merge_suggestions(audit_id);
