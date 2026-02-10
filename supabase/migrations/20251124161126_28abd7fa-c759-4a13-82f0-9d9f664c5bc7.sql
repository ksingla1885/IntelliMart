-- Create stock movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  batch_number TEXT,
  expiry_date DATE,
  reference_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_batch_number ON public.stock_movements(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_stock_movements_expiry_date ON public.stock_movements(expiry_date) WHERE expiry_date IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements
CREATE POLICY "Anyone can view stock movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock movements"
ON public.stock_movements
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete stock movements"
ON public.stock_movements
FOR DELETE
TO authenticated
USING (true);

-- Create function to automatically update product stock on movement
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'in' OR NEW.movement_type = 'adjustment' THEN
    UPDATE public.products
    SET stock = stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic stock updates
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();