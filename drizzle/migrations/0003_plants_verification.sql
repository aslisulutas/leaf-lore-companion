ALTER TABLE public.plants ADD COLUMN verification jsonb;
GRANT UPDATE (verification) ON public.plants TO authenticated;