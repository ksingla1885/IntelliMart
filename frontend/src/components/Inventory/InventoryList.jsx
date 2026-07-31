import { Package, Calendar, Hash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export function InventoryList({ products }) {
    if (products.length === 0) {
        return (
            <Card className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground"/>
                <h3 className="text-lg font-semibold mb-2">No inventory items</h3>
                <p className="text-muted-foreground">
                    Add products to start tracking inventory
                </p>
            </Card>
        );
    }

    const getStockStatus = (stock, reorderLevel) => {
        if (stock === 0)
            return { label: 'Out of Stock', variant: 'destructive' };
        if (stock <= reorderLevel)
            return { label: 'Low Stock', variant: 'destructive' };
        return { label: 'In Stock', variant: 'default' };
    };

    const getDaysUntilExpiry = (expiryDate) => {
        if (!expiryDate)
            return null;
        const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className="text-right">Unit Price (CP / SP)</TableHead>
                        <TableHead className="text-right">Stock Value (CP / SP)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => {
                        const status = getStockStatus(product.stock, product.reorder_level || product.reorderLevel || 5);
                        const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date);
                        const unitCP = parseFloat(product.costPrice || product.cost || 0);
                        const unitSP = parseFloat(product.sellingPrice || product.price || 0);
                        const totalCPVal = product.stock * unitCP;
                        const totalSPVal = product.stock * unitSP;

                        return (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                                <TableCell className="text-right font-semibold">
                                    {product.stock}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {product.reorder_level || product.reorderLevel || 5}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    {product.batch_number && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Hash className="w-3 h-3"/>
                                            {product.batch_number}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.expiry_date && (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="w-3 h-3"/>
                                                {format(new Date(product.expiry_date), 'MMM dd, yyyy')}
                                            </div>
                                            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {daysUntilExpiry} days left
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        <span className="text-[10px] text-muted-foreground font-normal">CP: </span>
                                        ₹{unitCP.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                        <span className="text-[10px] text-muted-foreground font-normal">SP: </span>
                                        ₹{unitSP.toFixed(2)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        <span className="text-[10px] text-muted-foreground font-normal">CP: </span>
                                        ₹{totalCPVal.toFixed(2)}
                                    </div>
                                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        <span className="text-[10px] text-muted-foreground font-normal">SP: </span>
                                        ₹{totalSPVal.toFixed(2)}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Card>
    );
}
