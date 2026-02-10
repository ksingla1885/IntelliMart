-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_products linking table
CREATE TABLE public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  minimum_order_quantity INTEGER DEFAULT 1,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);

-- Create purchase_orders table (WITHOUT branch_id for single mart)
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  expected_delivery_date DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Anyone can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE USING (true);

-- RLS Policies for supplier_products
CREATE POLICY "Anyone can view supplier products" ON public.supplier_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create supplier products" ON public.supplier_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update supplier products" ON public.supplier_products FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete supplier products" ON public.supplier_products FOR DELETE USING (true);

-- RLS Policies for purchase_orders
CREATE POLICY "Anyone can view purchase orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase orders" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete purchase orders" ON public.purchase_orders FOR DELETE USING (true);

-- RLS Policies for purchase_order_items
CREATE POLICY "Anyone can view purchase order items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create purchase order items" ON public.purchase_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase order items" ON public.purchase_order_items FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete purchase order items" ON public.purchase_order_items FOR DELETE USING (true);

-- Function to generate PO number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter
  FROM public.purchase_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to process received purchase order (NO branch_id for single mart)
CREATE OR REPLACE FUNCTION public.process_purchase_order_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    -- Update product stock from PO items
    UPDATE public.products p
    SET stock = p.stock + poi.quantity
    FROM public.purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
      AND p.id = poi.product_id;
    
    NEW.received_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER process_po_receipt
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.process_purchase_order_receipt();
