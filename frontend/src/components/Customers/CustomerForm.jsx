import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/hooks/useCustomers';
import { User, Mail, Phone, MapPin, Percent, Gift, FileText } from 'lucide-react';
const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    discount_percentage: z.coerce.number().min(0).max(100).default(0),
    loyalty_points: z.coerce.number().min(0).default(0),
    is_active: z.boolean().default(true),
});
export const CustomerForm = ({ open, onClose, customer }) => {
    const { createCustomer, updateCustomer } = useCustomers();
    const isEditing = !!customer;
    const form = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            notes: '',
            discount_percentage: 0,
            loyalty_points: 0,
            is_active: true,
        },
    });
    useEffect(() => {
        if (customer) {
            form.reset({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                city: customer.city || '',
                notes: customer.notes || '',
                discount_percentage: Number(customer.discount_percentage),
                loyalty_points: customer.loyalty_points,
                is_active: customer.is_active,
            });
        }
        else {
            form.reset({
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                notes: '',
                discount_percentage: 0,
                loyalty_points: 0,
                is_active: true,
            });
        }
    }, [customer, form]);
    const onSubmit = async (data) => {
        const customerData = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            notes: data.notes || null,
            discount_percentage: data.discount_percentage,
            loyalty_points: data.loyalty_points,
            is_active: data.is_active,
        };
        if (isEditing) {
            await updateCustomer.mutateAsync({ id: customer.id, ...customerData });
        }
        else {
            await createCustomer.mutateAsync(customerData);
        }
        onClose();
    };
    return (<Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6"/>
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4"/>
                <span>Basic Information</span>
              </div>
              
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4"/>
                      Customer Name *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter customer name"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4"/>
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="customer@example.com"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4"/>
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 234 567 8900"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
              </div>
            </div>

            <Separator />

            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4"/>
                <span>Address Details</span>
              </div>
              
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main Street"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={form.control} name="city" render={({ field }) => (<FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="New York"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>
            </div>

            <Separator />

            {/* Loyalty & Discounts Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Gift className="h-4 w-4"/>
                <span>Loyalty & Discounts</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="discount_percentage" render={({ field }) => (<FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4"/>
                        Default Discount
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} placeholder="0"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
                <FormField control={form.control} name="loyalty_points" render={({ field }) => (<FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Gift className="h-4 w-4"/>
                        Loyalty Points
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} placeholder="0"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4"/>
                <span>Additional Information</span>
              </div>
              
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Add any additional notes about this customer..." rows={3}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={form.control} name="is_active" render={({ field }) => (<FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'Customer is active and can make purchases' : 'Customer is inactive'}
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange}/>
                    </FormControl>
                  </FormItem>)}/>
            </div>

            <Separator />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
                {createCustomer.isPending || updateCustomer.isPending ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>);
};
