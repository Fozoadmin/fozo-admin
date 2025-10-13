import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, User } from "lucide-react";

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  
  // Detail popup
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search?: string) => {
    try {
      setSearching(true);
      const data = await adminApi.getAllUsers('customer', search);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchCustomers();
  };

  const openCustomerDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setOpenDetail(true);
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Customers</CardTitle>
            <div className="flex gap-2 w-full max-w-md">
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, or phone"
              />
              <Button onClick={handleSearch} disabled={searching} className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              {searchTerm && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openCustomerDetail(c)}
                  >
                    <TableCell className="font-medium">{c.full_name || 'N/A'}</TableCell>
                    <TableCell>{c.email || 'N/A'}</TableCell>
                    <TableCell>{c.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="default" 
                        className="bg-blue-100 text-blue-800 border-blue-200"
                      >
                        customer
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.is_verified ? "default" : "secondary"}>
                        {c.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="text-sm mt-1">{selectedCustomer.full_name || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="text-sm mt-1">{selectedCustomer.email || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <div className="text-sm mt-1">{selectedCustomer.phone_number || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Type</label>
                  <div className="text-sm mt-1">
                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                      {selectedCustomer.user_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verified</label>
                  <div className="text-sm mt-1">
                    <Badge variant={selectedCustomer.is_verified ? "default" : "secondary"}>
                      {selectedCustomer.is_verified ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Active</label>
                  <div className="text-sm mt-1">
                    <Badge variant={selectedCustomer.is_active ? "default" : "destructive"}>
                      {selectedCustomer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <div className="text-sm mt-1">
                    {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="text-sm mt-1 font-mono text-xs">{selectedCustomer.id}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
