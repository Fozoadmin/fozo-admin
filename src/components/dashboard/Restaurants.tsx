import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Basic Info
  const [formR, setFormR] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    restaurantName: "",
    contactPersonName: "",
    fssaiLicenseNumber: "",
    gstinNumber: ""
  });

  // Location Info
  const [location, setLocation] = useState({
    locationName: "",
    address: "",
    latitude: "",
    longitude: "",
    contactNumber: "",
    email: ""
  });

  // Operating Hours
  const [operatingHours, setOperatingHours] = useState<Record<string, {open: string, close: string, isClosed: boolean}>>({
    monday: { open: "09:00", close: "22:00", isClosed: false },
    tuesday: { open: "09:00", close: "22:00", isClosed: false },
    wednesday: { open: "09:00", close: "22:00", isClosed: false },
    thursday: { open: "09:00", close: "22:00", isClosed: false },
    friday: { open: "09:00", close: "22:00", isClosed: false },
    saturday: { open: "09:00", close: "22:00", isClosed: false },
    sunday: { open: "09:00", close: "22:00", isClosed: false }
  });

  // Bank Details
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: ""
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

  const resetForm = () => {
    setFormR({
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      restaurantName: "",
      contactPersonName: "",
      fssaiLicenseNumber: "",
      gstinNumber: ""
    });
    setLocation({
      locationName: "",
      address: "",
      latitude: "",
      longitude: "",
      contactNumber: "",
      email: ""
    });
    setOperatingHours({
      monday: { open: "09:00", close: "22:00", isClosed: false },
      tuesday: { open: "09:00", close: "22:00", isClosed: false },
      wednesday: { open: "09:00", close: "22:00", isClosed: false },
      thursday: { open: "09:00", close: "22:00", isClosed: false },
      friday: { open: "09:00", close: "22:00", isClosed: false },
      saturday: { open: "09:00", close: "22:00", isClosed: false },
      sunday: { open: "09:00", close: "22:00", isClosed: false }
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
      
      // Validate required fields
      if (!formR.fullName || !formR.password || !formR.restaurantName) {
        alert("Please fill in all required fields (Name, Password, Restaurant Name)");
        return;
      }
      
      if (!formR.email && !formR.phoneNumber) {
        alert("Please provide either email or phone number");
        return;
      }
      
      if (!location.address || !location.latitude || !location.longitude) {
        alert("Please provide complete location details (Address, Latitude, Longitude)");
        return;
      }
      
      // Build bank details object if any field is provided
      const bankAccountDetails = (bankDetails.accountNumber || bankDetails.ifscCode) ? {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName
      } : undefined;
      
      // Build operating hours array
      const hoursArray = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        openTime: operatingHours[day].isClosed ? null : operatingHours[day].open + ':00',
        closeTime: operatingHours[day].isClosed ? null : operatingHours[day].close + ':00',
        isClosed: operatingHours[day].isClosed
      }));
      
      // Single API call to onboard restaurant with all details
      await adminApi.onboardRestaurant({
        phoneNumber: formR.phoneNumber || undefined,
        email: formR.email || undefined,
        password: formR.password,
        fullName: formR.fullName,
        userType: 'restaurant',
        restaurantName: formR.restaurantName,
        contactPersonName: formR.contactPersonName || formR.fullName,
        fssaiLicenseNumber: formR.fssaiLicenseNumber || undefined,
        gstinNumber: formR.gstinNumber || undefined,
        bankAccountDetails,
        primaryLocation: {
          locationName: location.locationName || formR.restaurantName,
          address: location.address,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          contactNumber: location.contactNumber || formR.phoneNumber,
          email: location.email || formR.email
        },
        operatingHours: hoursArray
      });
      
      // Refresh the list
      setRestaurants(await adminApi.getAllRestaurants());
      setOpenAdd(false);
      resetForm();
      alert("Restaurant onboarded successfully!");
    } catch (err) {
      console.error('Create restaurant failed', err);
      alert(`Failed to create restaurant: ${err}`);
    } finally {
      setCreating(false);
    }
  };

  const updateOperatingHours = (day: string, field: 'open' | 'close' | 'isClosed', value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Partner Restaurants</CardTitle>
          <Dialog open={openAdd} onOpenChange={(open) => { setOpenAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/>Add Restaurant</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Restaurant</DialogTitle>
                <DialogDescription>Complete restaurant onboarding with all details</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="hours">Operating Hours</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Owner Full Name *</label>
                      <Input value={formR.fullName} onChange={e => setFormR({...formR, fullName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Restaurant Name *</label>
                      <Input value={formR.restaurantName} onChange={e => setFormR({...formR, restaurantName: e.target.value})} placeholder="Tasty Bites" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input type="email" value={formR.email} onChange={e => setFormR({...formR, email: e.target.value})} placeholder="owner@restaurant.com" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone Number *</label>
                      <Input value={formR.phoneNumber} onChange={e => setFormR({...formR, phoneNumber: e.target.value})} placeholder="+919876543210" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <Input type="password" value={formR.password} onChange={e => setFormR({...formR, password: e.target.value})} placeholder="Initial password" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Person</label>
                      <Input value={formR.contactPersonName} onChange={e => setFormR({...formR, contactPersonName: e.target.value})} placeholder="Manager name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">FSSAI License</label>
                      <Input value={formR.fssaiLicenseNumber} onChange={e => setFormR({...formR, fssaiLicenseNumber: e.target.value})} placeholder="12345678901234" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">GSTIN</label>
                      <Input value={formR.gstinNumber} onChange={e => setFormR({...formR, gstinNumber: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> Restaurants onboarded by admins are automatically approved and verified.
                    </p>
                  </div>
                </TabsContent>
                
                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Location Name</label>
                      <Input value={location.locationName} onChange={e => setLocation({...location, locationName: e.target.value})} placeholder="Main Branch" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Address *</label>
                      <Input value={location.address} onChange={e => setLocation({...location, address: e.target.value})} placeholder="123 Main Street, City, State - 400001" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Latitude *</label>
                      <Input type="number" step="0.000001" value={location.latitude} onChange={e => setLocation({...location, latitude: e.target.value})} placeholder="19.076090" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Longitude *</label>
                      <Input type="number" step="0.000001" value={location.longitude} onChange={e => setLocation({...location, longitude: e.target.value})} placeholder="72.877426" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location Contact</label>
                      <Input value={location.contactNumber} onChange={e => setLocation({...location, contactNumber: e.target.value})} placeholder="+919876543210" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location Email</label>
                      <Input type="email" value={location.email} onChange={e => setLocation({...location, email: e.target.value})} placeholder="branch@restaurant.com" />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Operating Hours Tab */}
                <TabsContent value="hours" className="space-y-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="flex items-center gap-4 p-2 border rounded">
                      <div className="w-24 font-medium capitalize">{day}</div>
                      <input 
                        type="checkbox" 
                        checked={operatingHours[day].isClosed} 
                        onChange={(e) => updateOperatingHours(day, 'isClosed', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label className="text-sm">Closed</label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="time" 
                          value={operatingHours[day].open} 
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          disabled={operatingHours[day].isClosed}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input 
                          type="time" 
                          value={operatingHours[day].close} 
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          disabled={operatingHours[day].isClosed}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
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
                <Button variant="outline" onClick={() => { setOpenAdd(false); resetForm(); }}>Cancel</Button>
                <Button disabled={creating} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Restaurant'}
                </Button>
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
