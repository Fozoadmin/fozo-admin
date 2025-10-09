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

export function DeliveryPartners() {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formD, setFormD] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    vehicle_type: "bicycle",
    documents_verified: false,
    status: "pending" as 'pending' | 'approved' | 'rejected' | 'suspended'
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchDeliveryPartners = async () => {
      try {
        const data = await adminApi.getAllDeliveryPartners();
        if (!isMounted) return;
        setDeliveryPartners(data);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching delivery partners:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchDeliveryPartners();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      await adminApi.registerPasswordUser({
        fullName: formD.fullName,
        email: formD.email || undefined,
        phoneNumber: formD.phoneNumber || undefined,
        password: formD.password,
        userType: 'delivery_partner'
      });
      const all = await adminApi.getAllDeliveryPartners();
      const created = all.find((d) => d.email === formD.email || d.phone_number === formD.phoneNumber);
      if (created) {
        await adminApi.updateDeliveryPartnerStatus(created.user_id, formD.status, formD.documents_verified);
      }
      setDeliveryPartners(await adminApi.getAllDeliveryPartners());
      setOpenAdd(false);
    } catch (err) {
      console.error('Create delivery partner failed', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Delivery Partners</CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/>Add Delivery Partner</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Delivery Partner</DialogTitle>
                <DialogDescription>Register a delivery partner and set status/verification.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Full Name</label>
                  <Input value={formD.fullName} onChange={e => setFormD({ ...formD, fullName: e.target.value })} placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm">Email</label>
                    <Input value={formD.email} onChange={e => setFormD({ ...formD, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm">Phone</label>
                    <Input value={formD.phoneNumber} onChange={e => setFormD({ ...formD, phoneNumber: e.target.value })} placeholder="+91..." />
                  </div>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Temporary Password</label>
                  <Input type="password" value={formD.password} onChange={e => setFormD({ ...formD, password: e.target.value })} placeholder="Set initial password" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Vehicle Type</label>
                  <Select value={formD.vehicle_type} onValueChange={(v) => setFormD({ ...formD, vehicle_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Vehicle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="scooter">Scooter</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div className="text-sm">
                    <div className="font-medium">Documents Verified</div>
                    <div className="text-muted-foreground">Mark KYC/documents as verified</div>
                  </div>
                  <input type="checkbox" className="h-5 w-5" checked={formD.documents_verified} onChange={(e) => setFormD({ ...formD, documents_verified: e.target.checked })} />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Status</label>
                  <Select value={formD.status} onValueChange={(v) => setFormD({ ...formD, status: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
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
            <div className="text-center py-8">Loading delivery partners...</div>
          ) : deliveryPartners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No delivery partners found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryPartners.map((d) => (
                  <TableRow key={d.user_id}>
                    <TableCell className="font-medium">{d.full_name || 'N/A'}</TableCell>
                    <TableCell>{d.email || 'N/A'}</TableCell>
                    <TableCell>{d.phone_number || 'N/A'}</TableCell>
                    <TableCell>{d.vehicle_type || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        d.status === "approved" ? "default" :
                        d.status === "rejected" ? "destructive" :
                        "secondary"
                      }>
                        {d.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.is_available ? "default" : "secondary"}>
                        {d.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.documents_verified ? "default" : "secondary"}>
                        {d.documents_verified ? "Yes" : "No"}
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

