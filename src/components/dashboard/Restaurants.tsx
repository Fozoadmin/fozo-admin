import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formR, setFormR] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    restaurantName: "",
    contactPersonName: "",
    fssaiLicenseNumber: "",
    gstinNumber: "",
    documentsVerified: false,
    status: "pending" as 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed'
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchRestaurants = async () => {
      try {
        const data = await adminApi.getAllRestaurants();
        if (!isMounted) return;
        setRestaurants(data);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching restaurants:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchRestaurants();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      await adminApi.registerPasswordUser({
        fullName: formR.fullName,
        email: formR.email || undefined,
        phoneNumber: formR.phoneNumber || undefined,
        password: formR.password,
        userType: 'restaurant'
      });
      const refreshed = await adminApi.getAllRestaurants();
      const created = refreshed.find((r) => r.user_email === formR.email || r.phone_number === formR.phoneNumber);
      if (created) {
        await adminApi.updateRestaurantProfile(created.restaurant_id, {
          restaurantName: formR.restaurantName,
          contactPersonName: formR.fullName,
          fssaiLicenseNumber: formR.fssaiLicenseNumber,
          gstinNumber: formR.gstinNumber,
        });
        await adminApi.updateRestaurantStatus(created.restaurant_id, formR.status, formR.documentsVerified);
      }
      setRestaurants(await adminApi.getAllRestaurants());
      setOpenAdd(false);
    } catch (err) {
      console.error('Create restaurant failed', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Partner Restaurants</CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/>Add Restaurant</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Restaurant</DialogTitle>
                <DialogDescription>Register a restaurant owner and optionally set verification/status.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Owner Full Name</label>
                  <Input value={formR.fullName} onChange={e => setFormR({ ...formR, fullName: e.target.value })} placeholder="Owner full name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm">Email</label>
                    <Input value={formR.email} onChange={e => setFormR({ ...formR, email: e.target.value })} placeholder="owner@email.com" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm">Phone</label>
                    <Input value={formR.phoneNumber} onChange={e => setFormR({ ...formR, phoneNumber: e.target.value })} placeholder="+91..." />
                  </div>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Temporary Password</label>
                  <Input type="password" value={formR.password} onChange={e => setFormR({ ...formR, password: e.target.value })} placeholder="Set initial password" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Restaurant Name</label>
                  <Input value={formR.restaurantName} onChange={e => setFormR({ ...formR, restaurantName: e.target.value })} placeholder="Restaurant name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm">FSSAI</label>
                    <Input value={formR.fssaiLicenseNumber} onChange={e => setFormR({ ...formR, fssaiLicenseNumber: e.target.value })} placeholder="FSSAI number" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm">GSTIN</label>
                    <Input value={formR.gstinNumber} onChange={e => setFormR({ ...formR, gstinNumber: e.target.value })} placeholder="GSTIN" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div className="text-sm">
                    <div className="font-medium">Documents Verified</div>
                    <div className="text-muted-foreground">Mark KYC/documents as verified</div>
                  </div>
                  <input type="checkbox" className="h-5 w-5" checked={formR.documentsVerified} onChange={(e) => setFormR({ ...formR, documentsVerified: e.target.checked })} />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Status</label>
                  <Select value={formR.status} onValueChange={(v) => setFormR({ ...formR, status: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button disabled={creating} onClick={handleCreate}>
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading restaurants...</div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No restaurants found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((r) => (
                  <TableRow key={r.restaurant_id}>
                    <TableCell className="font-medium">{r.restaurant_name || 'N/A'}</TableCell>
                    <TableCell>{r.contact_person_name || 'N/A'}</TableCell>
                    <TableCell>{r.user_email || 'N/A'}</TableCell>
                    <TableCell>{r.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        r.status === "approved" ? "default" :
                        r.status === "rejected" ? "destructive" :
                        "secondary"
                      }>
                        {r.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.average_rating || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={r.documents_verified ? "default" : "secondary"}>
                        {r.documents_verified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

