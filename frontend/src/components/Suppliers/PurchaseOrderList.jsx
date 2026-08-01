import { useState } from 'react';
import { Eye, Check, X, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { useSuppliers } from '@/hooks/useSuppliers';

export function PurchaseOrderList({ purchaseOrders, onRefresh }) {
  const [selectedPO, setSelectedPO] = useState(null);
  const [poItems, setPOItems] = useState([]);
  const { fetchPurchaseOrderItems, updatePurchaseOrderStatus } = useSuppliers();

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'outline',
      PENDING: 'secondary',
      ORDERED: 'secondary',
      APPROVED: 'default',
      RECEIVED: 'default',
      CANCELLED: 'destructive',
      PARTIALLY_RECEIVED: 'warning'
    };
    // Normalize status to uppercase key
    const normalizedStatus = status ? status.toUpperCase() : 'PENDING';
    return <Badge variant={variants[normalizedStatus] || 'outline'}>{normalizedStatus}</Badge>;
  };

  const handleViewDetails = (po) => {
    setSelectedPO(po);
    setPOItems(po.items || []);
  };

  const handleStatusChange = async (poId, status) => {
    const success = await updatePurchaseOrderStatus(poId, status);
    if (success) {
      onRefresh();
      setSelectedPO(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return '-';
    }
  };

  const isPending = (status) => status === 'PENDING' || status === 'pending';
  const isDraft = (status) => status === 'DRAFT' || status === 'draft';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders yet. Create one to order from suppliers.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium text-xs">
                      {po.po_number || po.id?.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{po.supplier?.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {po.items?.[0]?.product?.name || 'No items'}
                        {po.items?.length > 1 && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            (+{po.items.length - 1} more)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      ₹{Number(po.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {formatDate(po.createdAt || po.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(po)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isDraft(po.status) && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(po.id, 'PENDING')} title="Submit">
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {isPending(po.status) && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(po.id, 'RECEIVED')} title="Mark Received">
                            <Truck className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                        {(isDraft(po.status) || isPending(po.status)) && (
                          <Button variant="ghost" size="sm" onClick={() => handleStatusChange(po.id, 'CANCELLED')} title="Cancel">
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">PO Number:</span>
                  <p className="font-medium">{selectedPO.po_number || selectedPO.id?.substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Supplier:</span>
                  <p className="font-medium">{selectedPO.supplier?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>{getStatusBadge(selectedPO.status)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <p className="font-medium">
                    {formatDate(selectedPO.expected_delivery_date)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {formatDate(selectedPO.createdAt || selectedPO.created_at)}
                  </p>
                </div>
              </div>

              {selectedPO.notes && (
                <div>
                  <span className="text-muted-foreground text-sm">Notes:</span>
                  <p className="text-sm">{selectedPO.notes}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Base Cost</TableHead>
                      <TableHead className="text-right">GST %</TableHead>
                      <TableHead className="text-right">Real Unit Cost</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poItems.map((item) => {
                      const baseCost = Number(item.unit_cost || item.costPrice || 0);
                      const gstRate = Number(item.gstRate || 0);
                      const realCost = baseCost * (1 + gstRate / 100);
                      const lineTotal = Number(item.quantity) * realCost;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product?.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.product?.sku}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{baseCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{gstRate}%</TableCell>
                          <TableCell className="text-right font-medium text-primary">₹{realCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{lineTotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {(() => {
                const subtotalExclGst = poItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost || item.costPrice || 0)), 0);
                const totalGst = poItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost || item.costPrice || 0) * (Number(item.gstRate || 0) / 100)), 0);
                const grandTotal = Number(selectedPO.total_amount || (subtotalExclGst + totalGst));
                return (
                  <div className="border-t pt-3 space-y-1.5 text-sm bg-primary/5 p-3 rounded-lg">
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Subtotal (Excl. GST):</span>
                      <span>₹{subtotalExclGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Total GST Tax:</span>
                      <span>+ ₹{totalGst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-primary pt-1.5 border-t border-primary/20">
                      <span>Grand Total (Owner's Net Cost Incl. GST):</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {isDraft(selectedPO.status) && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => handleStatusChange(selectedPO.id, 'CANCELLED')}>
                    Cancel PO
                  </Button>
                  <Button onClick={() => handleStatusChange(selectedPO.id, 'PENDING')}>
                    Submit PO
                  </Button>
                </div>
              )}

              {isPending(selectedPO.status) && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => handleStatusChange(selectedPO.id, 'CANCELLED')}>
                    Cancel PO
                  </Button>
                  <Button onClick={() => handleStatusChange(selectedPO.id, 'RECEIVED')}>
                    Mark as Received
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
