import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, DollarSign, History } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
export const CustomerList = ({ onAdd, onEdit, onPricing, onHistory }) => {
    const { customers, isLoading, deleteCustomer } = useCustomers();
    const [search, setSearch] = useState('');
    const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()));
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer.mutate(id);
        }
    };
    return (<Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customers</CardTitle>
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4"/> Add Customer
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10"/>
          </div>
        </div>

        {isLoading ? (<div className="text-center py-8 text-muted-foreground">Loading...</div>) : filteredCustomers.length === 0 ? (<div className="text-center py-8 text-muted-foreground">No customers found</div>) : (<Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (<TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.email && <div>{customer.email}</div>}
                      {customer.phone && <div className="text-muted-foreground">{customer.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{customer.city || '-'}</TableCell>
                  <TableCell>{customer.discount_percentage}%</TableCell>
                  <TableCell>{customer.loyalty_points}</TableCell>
                  <TableCell>
                    <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          <Pencil className="mr-2 h-4 w-4"/> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPricing(customer)}>
                          <DollarSign className="mr-2 h-4 w-4"/> Custom Pricing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHistory(customer)}>
                          <History className="mr-2 h-4 w-4"/> Purchase History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>)}
      </CardContent>
    </Card>);
};
