-- Create stocktakes table for tracking stocktake sessions
CREATE TABLE public.stocktakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stocktake_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stocktake_items table for individual product counts
CREATE TABLE public.stocktake_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stocktake_id UUID NOT NULL REFERENCES public.stocktakes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  notes TEXT,
  counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stocktakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocktake_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for stocktakes
CREATE POLICY "Users can view stocktakes" ON public.stocktakes FOR SELECT USING (true);
CREATE POLICY "Users can create stocktakes" ON public.stocktakes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update stocktakes" ON public.stocktakes FOR UPDATE USING (true);

-- RLS policies for stocktake_items
CREATE POLICY "Users can view stocktake items" ON public.stocktake_items FOR SELECT USING (true);
CREATE POLICY "Users can create stocktake items" ON public.stocktake_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update stocktake items" ON public.stocktake_items FOR UPDATE USING (true);

-- Function to generate stocktake number
CREATE OR REPLACE FUNCTION public.generate_stocktake_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter
  FROM public.stocktakes
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := 'ST-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_stocktakes_updated_at
  BEFORE UPDATE ON public.stocktakes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();