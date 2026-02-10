-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer-specific pricing table
CREATE TABLE public.customer_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  custom_price NUMERIC,
  discount_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- Add customer_id to sales table
ALTER TABLE public.sales ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pricing ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE USING (true);

-- RLS policies for customer_pricing
CREATE POLICY "Anyone can view customer pricing" ON public.customer_pricing FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create customer pricing" ON public.customer_pricing FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customer pricing" ON public.customer_pricing FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete customer pricing" ON public.customer_pricing FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();