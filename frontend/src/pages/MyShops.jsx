import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/store/hooks";
import { fetchShops, deleteShop, updateShop } from "@/store/slices/shopSlice";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Store, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MyShops() {
    const { shops, loading } = useAppSelector((state) => state.shops);
    const dispatch = useDispatch();
    const { toast } = useToast();

    const [editShop, setEditShop] = useState(null); // Shop object to edit
    const [formData, setFormData] = useState({ name: "", address: "", mobile: "", gstin: "" });

    useEffect(() => {
        dispatch(fetchShops());
    }, [dispatch]);

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this shop? Details cannot be recovered.")) {
            try {
                await dispatch(deleteShop(id)).unwrap();
                toast({ title: "Shop Deleted" });
            } catch (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }
        }
    };

    const handleEditClick = (shop) => {
        setEditShop(shop);
        setFormData({ name: shop.name, address: shop.address || "", mobile: shop.mobile || "", gstin: shop.gstin || "" });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateShop({ id: editShop.id, data: formData })).unwrap();
            toast({ title: "Shop Updated" });
            setEditShop(null);
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold tracking-tight">My Shops</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
                    <Card key={shop.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" /> {shop.name}
                            </CardTitle>
                            <CardDescription>Created: {new Date(shop.createdAt || Date.now()).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Address: {shop.address || 'N/A'}</p>
                            <p className="text-sm text-gray-500">Mobile: {shop.mobile || 'N/A'}</p>
                            <p className="text-sm text-gray-500">GSTIN: {shop.gstin || 'N/A'}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(shop)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(shop.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {shops.length === 0 && !loading && (
                    <p className="text-gray-500">No shops found. Create one from the top bar.</p>
                )}
            </div>

            <Dialog open={!!editShop} onOpenChange={(open) => !open && setEditShop(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Shop</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mobile" className="text-right">Mobile</Label>
                            <Input id="mobile" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="gstin" className="text-right">GSTIN</Label>
                            <Input id="gstin" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} className="col-span-3" />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update Shop</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
