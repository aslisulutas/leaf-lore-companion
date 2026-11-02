ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS water_interval_days integer, ADD COLUMN IF NOT EXISTS fertilizer_interval_days integer, ADD COLUMN IF NOT EXISTS last_watered_at timestamptz, ADD COLUMN IF NOT EXISTS last_fertilized_at timestamptz;
GRANT UPDATE (water_interval_days, fertilizer_interval_days, last_watered_at, last_fertilized_at) ON public.plants TO authenticated;

CREATE TABLE public.plant_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo','note','water','fertilize','health')),
  image text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.plant_logs TO authenticated;
GRANT ALL ON public.plant_logs TO service_role;
ALTER TABLE public.plant_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own logs select" ON public.plant_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.plants p WHERE p.id = plant_logs.plant_id AND p.user_id = auth.uid()));
CREATE POLICY "own logs insert" ON public.plant_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.plants p WHERE p.id = plant_logs.plant_id AND p.user_id = auth.uid()));
CREATE POLICY "own logs delete" ON public.plant_logs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.plants p WHERE p.id = plant_logs.plant_id AND p.user_id = auth.uid()));

CREATE INDEX plant_logs_plant_created_idx ON public.plant_logs (plant_id, created_at DESC);