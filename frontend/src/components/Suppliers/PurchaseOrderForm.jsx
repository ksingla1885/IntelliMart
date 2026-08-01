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
import { toast as sonnerToast } from 'sonner';

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
  const [itemGstRate, setItemGstRate] = useState('0');
  const [isCustomGst, setIsCustomGst] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const GST_PRESETS = [0, 5, 8, 12, 15, 18, 21, 23, 27];

  const { createPurchaseOrder, fetchSupplierProducts, fetchProductSuppliers } = useSuppliers();
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
      const autoFillSupplierAndProduct = async () => {
        try {
          const productSuppliers = await fetchProductSuppliers(initialProduct.id);
          if (productSuppliers && productSuppliers.length > 0) {
            const preferred = productSuppliers.find(sp => sp.isPreferred) || productSuppliers[0];
            form.setValue('supplier_id', preferred.supplierId);
            await fetchSupplierProducts(preferred.supplierId);
            
            const cost = preferred.costPrice || initialProduct.costPrice || initialProduct.cost || 0;
            const pGst = Number(initialProduct.gstRate ?? 0);
            
            setSelectedProduct(initialProduct.id);
            setUnitCost(String(cost));
            setItemGstRate(String(pGst));
            setIsCustomGst(!GST_PRESETS.includes(pGst));
            setQuantity('');
            setItems([]);
          } else {
            const pGst = Number(initialProduct.gstRate ?? 0);
            setSelectedProduct(initialProduct.id);
            setUnitCost(String(initialProduct.costPrice || initialProduct.cost || 0));
            setItemGstRate(String(pGst));
            setIsCustomGst(!GST_PRESETS.includes(pGst));
            setQuantity('');
            setItems([]);
          }
        } catch (err) {
          console.error("Error auto-filling supplier and product:", err);
        }
      };
      
      autoFillSupplierAndProduct();
    }
  }, [open, initialProduct, products, fetchProductSuppliers, fetchSupplierProducts]);

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    const productGst = Number(product?.gstRate ?? 0);
    setItemGstRate(productGst.toString());
    setIsCustomGst(!GST_PRESETS.includes(productGst));

    const sp = supplierProducts.find(sp => sp.productId === productId);
    if (sp) {
      setUnitCost(String(sp.costPrice));
    } else {
      setUnitCost(String(product?.costPrice || product?.cost || 0));
    }
  };

  const addItem = () => {
    if (!selectedProduct || !quantity || !unitCost) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const parsedGst = Number(itemGstRate || 0);

    const existingIndex = items.findIndex(i => i.productId === selectedProduct);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += Number(quantity);
      newItems[existingIndex].unitCost = Number(unitCost);
      newItems[existingIndex].gstRate = parsedGst;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct,
          productName: product.name,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          gstRate: parsedGst,
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
    setItemGstRate('0');
    setIsCustomGst(false);
    
    // Visual feedback that item was successfully added
    sonnerToast.success(`Added ${product.name} (Qty: ${quantity}) to purchase order.`);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitCost * (item.gstRate / 100)), 0);
  const total = subtotal + tax;

  const selectedProductDetails = products.find(p => p.id === selectedProduct);
  const displaySellingPrice = selectedProductDetails ? (selectedProductDetails.sellingPrice || selectedProductDetails.price || 0) : '';

  const onSubmit = async (data) => {
    let finalItems = [...items];

    if (finalItems.length === 0 && selectedProduct && quantity && unitCost) {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        finalItems.push({
          productId: selectedProduct,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          gstRate: Number(itemGstRate || 0),
        });
      }
    }

    if (finalItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await createPurchaseOrder(
        data.supplier_id,
        finalItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost, gstRate: i.gstRate })),
        data.expected_delivery_date || undefined,
        data.notes || undefined
      );

      if (result) {
        form.reset();
        setItems([]);
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setItems([]);
    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
    setItemGstRate('0');
    setIsCustomGst(false);
    onClose();
  };

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
              <h4 className="font-medium text-sm flex items-center justify-between">
                <span>Order Items</span>
                <span className="text-xs font-normal text-muted-foreground">Select GST to calculate real purchase cost</span>
              </h4>

              <div className="flex flex-col gap-3 border rounded-md p-3 bg-muted/20">
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1 flex flex-col gap-1 w-full">
                    <span className="text-xs font-semibold text-muted-foreground">Product</span>
                    <Select
                      value={selectedProduct}
                      onValueChange={handleProductSelect}
                      disabled={!selectedSupplierId}
                    >
                      <SelectTrigger className="w-full">
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
                  </div>

                  <div className="flex gap-2 items-end w-full sm:w-auto">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Qty</span>
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="w-16"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Cost Price</span>
                      <Input
                        type="number"
                        placeholder="Cost"
                        className="w-20 bg-muted cursor-not-allowed"
                        value={unitCost}
                        readOnly
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Selling Price</span>
                      <Input
                        type="text"
                        placeholder="Sell Price"
                        className="w-20 bg-muted cursor-not-allowed"
                        value={displaySellingPrice ? `₹${Number(displaySellingPrice).toFixed(2)}` : ''}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* GST Option Pill Buttons for Item */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {selectedProductDetails && Number(selectedProductDetails.gstRate || 0) > 0 ? (
                    <div className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">GST Rate:</span>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedProductDetails.gstRate}% (Preset in Product)</span>
                      </div>
                      <Button type="button" onClick={addItem} size="sm" className="h-8 gap-1">
                        <Plus className="w-4 h-4" /> Add Item
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-muted-foreground">GST % (Optional):</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {GST_PRESETS.map((rate) => {
                          const isSelected = !isCustomGst && Number(itemGstRate || 0) === rate;
                          return (
                            <Button
                              key={rate}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2 text-xs font-medium"
                              onClick={() => {
                                setIsCustomGst(false);
                                setItemGstRate(rate.toString());
                              }}
                            >
                              {rate === 0 ? '0%' : `${rate}%`}
                            </Button>
                          );
                        })}
                        <Button
                          type="button"
                          variant={isCustomGst ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-xs font-medium"
                          onClick={() => setIsCustomGst(true)}
                        >
                          Custom
                        </Button>
                        {isCustomGst && (
                          <div className="flex items-center gap-1 w-24">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="Rate %"
                              className="h-7 text-xs"
                              value={itemGstRate}
                              onChange={(e) => setItemGstRate(e.target.value)}
                            />
                            <span className="text-xs font-semibold">%</span>
                          </div>
                        )}
                        <div className="ml-auto">
                          <Button type="button" onClick={addItem} size="sm" className="h-8 gap-1">
                            <Plus className="w-4 h-4" /> Add Item
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Real Cost preview for current pending item */}
                {selectedProduct && unitCost && (
                  <div className="text-xs bg-background p-2 rounded border flex justify-between items-center">
                    <span className="text-muted-foreground">Real Cost (Incl. {itemGstRate}% GST):</span>
                    <span className="font-bold text-primary">
                      ₹{(Number(unitCost) * (1 + Number(itemGstRate || 0) / 100)).toFixed(2)} / unit
                    </span>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {items.map((item, index) => {
                    const realUnit = item.unitCost * (1 + item.gstRate / 100);
                    const lineTotal = item.quantity * realUnit;
                    return (
                      <div key={index} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2 text-sm">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            Base: ₹{item.unitCost.toFixed(2)} | GST: {item.gstRate}% (₹{(item.unitCost * item.gstRate / 100).toFixed(2)}) | Real: ₹{realUnit.toFixed(2)}
                          </p>
                        </div>
                        <span className="w-12 text-center text-xs font-medium">{item.quantity} pcs</span>
                        <span className="w-24 text-right font-semibold text-sm">
                          ₹{lineTotal.toFixed(2)}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-destructive ml-2 h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t pt-2 space-y-1 text-sm bg-primary/5 p-3 rounded-lg">
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Subtotal (Excl. GST):</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Total GST Tax:</span>
                    <span>+ ₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-primary pt-1 border-t border-primary/20">
                    <span>Total Purchase Order Price:</span>
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
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="px-8" disabled={isSubmitting || (items.length === 0 && (!selectedProduct || !quantity || !unitCost))}>
                {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
