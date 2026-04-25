import { useState, useEffect } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';

const poSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
});

export function PurchaseOrderForm({ open, suppliers, onClose, onSuccess, initialProduct }) {
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierProducts, setSupplierProducts] = useState([]);

  const { createPurchaseOrder, fetchSupplierProducts } = useSuppliers();
  const { products, fetchProducts } = useProducts();

  const form = useForm({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplier_id: '',
      expected_delivery_date: '',
      notes: '',
    },
  });

  const selectedSupplierId = form.watch('supplier_id');

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchSupplierProducts(selectedSupplierId).then(setSupplierProducts);
    } else {
      setSupplierProducts([]);
    }
  }, [selectedSupplierId]);

  // Handle initial product pre-filling
  useEffect(() => {
    if (open && initialProduct && products.length > 0) {
      // If we have an initial product, we want to make it easy to order it.
      // We don't necessarily know which supplier the user will pick yet.
      // So we just set the selected product in the "Add Item" section.
      setSelectedProduct(initialProduct.id);
      setUnitCost(String(initialProduct.costPrice || initialProduct.cost || 0));
      setQuantity(String(Math.max(1, (initialProduct.reorderLevel || 5) - initialProduct.stock)));
    }
  }, [open, initialProduct, products]);

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    // Auto-fill cost from supplier product if available
    const sp = supplierProducts.find(sp => sp.productId === productId);
    if (sp) {
      setUnitCost(String(sp.costPrice));
    } else {
      const product = products.find(p => p.id === productId);
      setUnitCost(String(product?.costPrice || product?.cost || 0));
    }
  };

  const addItem = () => {
    if (!selectedProduct || !quantity || !unitCost) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingIndex = items.findIndex(i => i.productId === selectedProduct);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += Number(quantity);
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct,
          productName: product.name,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const onSubmit = async (data) => {
    let finalItems = [...items];

    // If no items added but inputs are filled, add the current pending item
    if (finalItems.length === 0 && selectedProduct && quantity && unitCost) {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        finalItems.push({
          productId: selectedProduct,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
        });
      }
    }

    if (finalItems.length === 0) return;

    const result = await createPurchaseOrder(
      data.supplier_id,
      finalItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
      data.expected_delivery_date || undefined,
      data.notes || undefined
    );

    if (result) {
      form.reset();
      setItems([]);
      onSuccess();
    }
  };

  const handleClose = () => {
    form.reset();
    setItems([]);
    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
    onClose();
  };

  const isLinked = (productId) => supplierProducts.some(sp => sp.productId === productId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.filter(s => s.is_active).map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Order Items</h4>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={selectedProduct}
                  onValueChange={handleProductSelect}
                  disabled={!selectedSupplierId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={selectedSupplierId ? "Select product" : "Select supplier first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierProducts.length > 0 ? (
                      supplierProducts.map((sp) => (
                        <SelectItem key={sp.product.id} value={sp.product.id}>
                          {sp.product.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No products available for this supplier
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="w-20"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                  <Input
                    type="number"
                    placeholder="Cost"
                    className="w-24"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 text-sm">
                      <span className="flex-1 font-medium truncate">{item.productName}</span>
                      <span className="w-16 text-center">{item.quantity}</span>
                      <span className="w-20 text-right">₹{item.unitCost.toFixed(2)}</span>
                      <span className="w-24 text-right font-semibold">
                        ₹{(item.quantity * item.unitCost).toFixed(2)}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t pt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%):</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="px-8" disabled={items.length === 0 && (!selectedProduct || !quantity || !unitCost)}>
                Create Purchase Order
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
