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
import { Plus, Bike, Trash2, Edit, CheckCircle2, XCircle, Ban } from "lucide-react";

export function DeliveryPartners() {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Detail popup
  const [selectedDP, setSelectedDP] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Edit mode
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  
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

  // Check if all required fields are filled
  const isFormValid = () => {
    // For delivery partners: only phoneNumber, fullName, and vehicleType are required
    return formD.fullName && formD.phoneNumber && formD.vehicleType;
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
        phoneNumber: `+91${formD.phoneNumber}`,
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

  const openEditDialog = (dp: any) => {
    setSelectedDP(dp);
    
    // Pre-fill form with existing data
    setFormD({
      fullName: dp.full_name || "",
      email: dp.email || "",
      phoneNumber: dp.phone_number?.replace('+91', '') || "",
      password: "", // Don't pre-fill password
      vehicleType: dp.vehicle_type || "bicycle",
      licenseNumber: dp.license_number || ""
    });
    
    // Pre-fill bank details
    if (dp.bank_account_details) {
      setBankDetails({
        accountNumber: dp.bank_account_details.accountNumber || "",
        ifscCode: dp.bank_account_details.ifscCode || "",
        accountHolderName: dp.bank_account_details.accountHolderName || "",
        bankName: dp.bank_account_details.bankName || ""
      });
    } else {
      setBankDetails({
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: ""
      });
    }
    
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedDP) return;
    
    try {
      setEditing(true);
      
      if (!formD.fullName || !formD.vehicleType) {
        alert("Please fill in all required fields (Name and Vehicle Type)");
        return;
      }
      
      // Build bank details object if any field is provided
      const bankAccountDetails = (bankDetails.accountNumber || bankDetails.ifscCode) ? {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName
      } : undefined;
      
      // Update delivery partner
      await adminApi.updateDeliveryPartner(selectedDP.user_id, {
        fullName: formD.fullName,
        vehicleType: formD.vehicleType,
        licenseNumber: formD.licenseNumber || undefined,
        bankAccountDetails
      });
      
      // Refresh list
      const updatedDPs = await adminApi.getAllDeliveryPartners();
      setDeliveryPartners(updatedDPs);
      setOpenEdit(false);
      resetForm();
      alert("Delivery Partner updated successfully!");
    } catch (error) {
      console.error('Update failed', error);
      alert(`Failed to update delivery partner: ${error}`);
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (dp: any) => {
    setSelectedDP(dp);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedDP) return;
    
    try {
      setDeleting(true);
      await adminApi.deleteUser(selectedDP.user_id);
      
      // Refresh list
      const updatedDPs = await adminApi.getAllDeliveryPartners();
      setDeliveryPartners(updatedDPs);
      setDeleteConfirm(false);
      setSelectedDP(null);
      alert("Delivery Partner deleted successfully!");
    } catch (error: any) {
      console.error('Delete failed', error);
      alert(`Failed to delete delivery partner: ${error?.message || error}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (dpUserId: string, newStatus: string) => {
    try {
      await adminApi.updateDeliveryPartnerStatus(dpUserId, newStatus as any);
      
      // Refresh list
      const updatedDPs = await adminApi.getAllDeliveryPartners();
      setDeliveryPartners(updatedDPs);
    } catch (error) {
      console.error('Status update failed', error);
      alert(`Failed to update status: ${error}`);
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                        <Input 
                          value={formD.phoneNumber} 
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setFormD({...formD, phoneNumber: value});
                            }
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Used for OTP-based login (10 digits)</p>
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
                <Button disabled={creating || !isFormValid()} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Delivery Partner'}
                </Button>
              </div>
              {!isFormValid() && (
                <p className="text-xs text-amber-600 text-right mt-2">
                  Please fill all required fields (Name, Phone Number, Vehicle Type)
                </p>
              )}
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryPartners.map((d) => (
                  <TableRow 
                    key={d.user_id}
                  >
                    <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => { setSelectedDP(d); setOpenDetail(true); }}>{d.full_name || 'N/A'}</TableCell>
                    <TableCell>{d.email || 'N/A'}</TableCell>
                    <TableCell>{d.phone_number || 'N/A'}</TableCell>
                    <TableCell className="capitalize">{d.vehicle_type || 'N/A'}</TableCell>
                    <TableCell>
                      <Select value={d.status || 'pending'} onValueChange={(value) => handleStatusChange(d.user_id, value)}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="approved">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Approved
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3 w-3 text-red-600" />
                              Rejected
                            </div>
                          </SelectItem>
                          <SelectItem value="suspended">
                            <div className="flex items-center gap-2">
                              <Ban className="h-3 w-3 text-orange-600" />
                              Suspended
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(d)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDeleteDialog(d)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delivery Partner Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5" />
              Delivery Partner Details
            </DialogTitle>
          </DialogHeader>
          {selectedDP && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="text-sm mt-1">{selectedDP.full_name || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="text-sm mt-1">{selectedDP.email || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <div className="text-sm mt-1">{selectedDP.phone_number || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vehicle Type</label>
                  <div className="text-sm mt-1 capitalize">{selectedDP.vehicle_type || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Number</label>
                  <div className="text-sm mt-1">{selectedDP.license_number || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="text-sm mt-1">
                    <Badge variant={
                      selectedDP.status === "approved" ? "default" :
                      selectedDP.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {selectedDP.status || 'pending'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Online Status</label>
                  <div className="text-sm mt-1">
                    <Badge variant={selectedDP.is_online ? "default" : "secondary"}>
                      {selectedDP.is_online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documents Verified</label>
                  <div className="text-sm mt-1">
                    <Badge variant={selectedDP.documents_verified ? "default" : "secondary"}>
                      {selectedDP.documents_verified ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Deliveries</label>
                  <div className="text-sm mt-1">{selectedDP.total_deliveries || 0}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Average Rating</label>
                  <div className="text-sm mt-1">{selectedDP.average_rating || '0.0'} ⭐</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <div className="text-sm mt-1">
                    {selectedDP.created_at ? new Date(selectedDP.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="text-xs mt-1 font-mono">{selectedDP.user_id}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Delivery Partner Dialog */}
      <Dialog open={openEdit} onOpenChange={(open) => { 
        setOpenEdit(open); 
        if (!open) resetForm(); 
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Delivery Partner</DialogTitle>
            <DialogDescription>
              Update details for {selectedDP?.full_name}
            </DialogDescription>
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
                  <label className="text-sm font-medium">Vehicle Type *</label>
                  <Select value={formD.vehicleType} onValueChange={(value: any) => setFormD({...formD, vehicleType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="scooter">Scooter</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={formD.email} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                    <Input value={formD.phoneNumber} disabled className="bg-muted cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Phone cannot be changed</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">License Number</label>
                  <Input value={formD.licenseNumber} onChange={e => setFormD({...formD, licenseNumber: e.target.value})} placeholder="DL12345678" />
                </div>
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
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setOpenEdit(false); resetForm(); }}>Cancel</Button>
            <Button 
              disabled={editing || !formD.fullName || !formD.vehicleType} 
              onClick={handleUpdate}
            >
              {editing ? 'Updating...' : 'Update Partner'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDP?.full_name || selectedDP?.email || 'this delivery partner'}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone. This will permanently delete the delivery partner
              account and all associated data.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              disabled={deleting} 
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete Delivery Partner'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
