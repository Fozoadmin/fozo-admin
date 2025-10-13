import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    vehicleType: "bicycle" as 'bicycle' | 'scooter' | 'motorcycle' | 'car',
    licenseNumber: ""
  });

  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: ""
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

  const resetForm = () => {
    setFormD({
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      vehicleType: "bicycle",
      licenseNumber: ""
    });
    setBankDetails({
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: ""
    });
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      
      // Validate required fields - only phoneNumber, fullName, and vehicleType are required
      if (!formD.fullName || !formD.vehicleType) {
        alert("Please fill in all required fields (Name and Vehicle Type)");
        return;
      }
      
      if (!formD.phoneNumber) {
        alert("Phone number is required for delivery partners (used for OTP login)");
        return;
      }
      
      // Build bank details object if any field is provided
      const bankAccountDetails = (bankDetails.accountNumber || bankDetails.ifscCode) ? {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName
      } : undefined;
      
      // Single API call to onboard delivery partner with all details
      await adminApi.onboardDeliveryPartner({
        phoneNumber: formD.phoneNumber,
        email: formD.email || undefined,
        password: formD.password || undefined,
        fullName: formD.fullName,
        userType: 'delivery_partner',
        vehicleType: formD.vehicleType,
        licenseNumber: formD.licenseNumber || undefined,
        bankAccountDetails
      });
      
      // Refresh the list
      setDeliveryPartners(await adminApi.getAllDeliveryPartners());
      setOpenAdd(false);
      resetForm();
      alert("Delivery Partner onboarded successfully!");
    } catch (err) {
      console.error('Create delivery partner failed', err);
      alert(`Failed to create delivery partner: ${err}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Delivery Partners</CardTitle>
          <Dialog open={openAdd} onOpenChange={(open) => { setOpenAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/>Add Delivery Partner</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Delivery Partner</DialogTitle>
                <DialogDescription>Complete delivery partner onboarding with all details</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info & Vehicle</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input value={formD.fullName} onChange={e => setFormD({...formD, fullName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input value={formD.phoneNumber} onChange={e => setFormD({...formD, phoneNumber: e.target.value})} placeholder="+919876543210" />
                      <p className="text-xs text-muted-foreground mt-1">Used for OTP-based login</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email (Optional)</label>
                      <Input type="email" value={formD.email} onChange={e => setFormD({...formD, email: e.target.value})} placeholder="john@example.com" />
                      <p className="text-xs text-muted-foreground mt-1">Optional - DPs use OTP login</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password (Optional)</label>
                      <Input type="password" value={formD.password} onChange={e => setFormD({...formD, password: e.target.value})} placeholder="Optional password" />
                      <p className="text-xs text-muted-foreground mt-1">Optional - DPs typically use OTP</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vehicle Type *</label>
                      <Select value={formD.vehicleType} onValueChange={(v) => setFormD({...formD, vehicleType: v as any})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bicycle">Bicycle</SelectItem>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="motorcycle">Motorcycle</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">License Number</label>
                      <Input value={formD.licenseNumber} onChange={e => setFormD({...formD, licenseNumber: e.target.value})} placeholder="DL1234567890" />
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Authentication:</strong> Delivery partners use OTP-based login via phone number. Email and password are optional and can be left blank.
                    </p>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Auto-Approval:</strong> Delivery partners onboarded by admins are automatically approved and verified.
                    </p>
                  </div>
                </TabsContent>
                
                {/* Bank Details Tab */}
                <TabsContent value="bank" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Account Holder Name</label>
                      <Input value={bankDetails.accountHolderName} onChange={e => setBankDetails({...bankDetails, accountHolderName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bank Name</label>
                      <Input value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="HDFC Bank" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Number</label>
                      <Input value={bankDetails.accountNumber} onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="1234567890" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">IFSC Code</label>
                      <Input value={bankDetails.ifscCode} onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})} placeholder="HDFC0001234" />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Bank details will be used for payment settlements
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setOpenAdd(false); resetForm(); }}>Cancel</Button>
                <Button disabled={creating} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Delivery Partner'}
                </Button>
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
                  <TableHead>Online</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryPartners.map((d) => (
                  <TableRow key={d.user_id}>
                    <TableCell className="font-medium">{d.full_name || 'N/A'}</TableCell>
                    <TableCell>{d.email || 'N/A'}</TableCell>
                    <TableCell>{d.phone_number || 'N/A'}</TableCell>
                    <TableCell className="capitalize">{d.vehicle_type || 'N/A'}</TableCell>
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
                      <Badge variant={d.is_online ? "default" : "secondary"}>
                        {d.is_online ? "Online" : "Offline"}
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
