-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile', 'other')),
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  notes TEXT,
  cashier_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_sales_sale_number ON public.sales(sale_number);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);

-- Enable Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales
CREATE POLICY "Anyone can view sales"
ON public.sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create sales"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
ON public.sales
FOR UPDATE
TO authenticated
USING (true);

-- RLS Policies for sale_items
CREATE POLICY "Anyone can view sale items"
ON public.sale_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create sale items"
ON public.sale_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the count of sales today
  SELECT COUNT(*) + 1 INTO counter
  FROM public.sales
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate sale number: SALE-YYYYMMDD-XXXX
  new_number := 'SALE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to process sale and update inventory
CREATE OR REPLACE FUNCTION public.process_sale_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Create stock movement for each sale item
  INSERT INTO public.stock_movements (product_id, movement_type, quantity, reference_number, notes)
  VALUES (
    NEW.product_id,
    'out',
    NEW.quantity,
    (SELECT sale_number FROM public.sales WHERE id = NEW.sale_id),
    'POS Sale'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically process inventory on sale
CREATE TRIGGER trigger_process_sale_transaction
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.process_sale_transaction();