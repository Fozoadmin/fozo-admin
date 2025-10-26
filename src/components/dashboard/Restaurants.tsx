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
import { Plus, MapPin, Loader2, Search, Building2, Edit, Trash2, CheckCircle2, XCircle, Ban } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  
  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  
  // Detail popup
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  
  // Edit mode
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Cuisines
  const [cuisines, setCuisines] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<number[]>([]);
  
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
    fetchRestaurants();
    fetchCuisines();
  }, []);

  const fetchCuisines = async () => {
    try {
      const data = await adminApi.getAllCuisines();
      setCuisines(data);
    } catch (error) {
      console.error('Error fetching cuisines:', error);
    }
  };

  const fetchRestaurants = async (search?: string) => {
    try {
      setSearching(true);
      const data = await adminApi.getAllRestaurants(search);
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = () => {
    fetchRestaurants(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchRestaurants();
  };

  const openRestaurantDetail = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setOpenDetail(true);
  };

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
    setSelectedCuisineIds([]);
  };

  // Geocode address to get lat/long
  const handleGeocodeAddress = async () => {
    if (!location.address.trim()) {
      alert("Please enter an address first");
      return;
    }

    try {
      setGeocoding(true);
      const encodedAddress = encodeURIComponent(location.address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        
        setLocation({
          ...location,
          latitude: lat.toString(),
          longitude: lng.toString()
        });
        
        alert("Location coordinates found successfully!");
      } else {
        alert(`Geocoding failed: ${data.status}. Please check the address and try again.`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to get coordinates. Please check your internet connection and try again.");
    } finally {
      setGeocoding(false);
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    // Basic info validation
    const basicValid = formR.fullName && formR.password && formR.restaurantName && 
                       (formR.email || formR.phoneNumber);
    
    // Location validation (must have address AND coordinates)
    const locationValid = location.address && location.latitude && location.longitude;
    
    // Cuisine validation (at least one cuisine must be selected)
    const cuisineValid = selectedCuisineIds.length > 0;
    
    return basicValid && locationValid && cuisineValid;
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
      
      if (selectedCuisineIds.length === 0) {
        alert("Please select at least one cuisine");
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
        phoneNumber: formR.phoneNumber ? `+91${formR.phoneNumber}` : undefined,
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
          contactNumber: location.contactNumber ? `+91${location.contactNumber}` : (formR.phoneNumber ? `+91${formR.phoneNumber}` : undefined),
          email: location.email || formR.email
        },
        operatingHours: hoursArray,
        restaurantCuisineIds: selectedCuisineIds
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

  const openEditDialog = async (restaurant: any) => {
    try {
      // Fetch full restaurant details including location and operating hours
      const fullDetails = await adminApi.getRestaurantById(restaurant.restaurant_id);
      setSelectedRestaurant(fullDetails);
      
      // Pre-fill form with existing data
      setFormR({
        fullName: fullDetails.user_full_name || "",
        email: fullDetails.user_email || "",
        phoneNumber: fullDetails.phone_number?.replace('+91', '') || "",
        password: "", // Don't pre-fill password
        restaurantName: fullDetails.restaurant_name || "",
        contactPersonName: fullDetails.contact_person_name || "",
        fssaiLicenseNumber: fullDetails.fssai_license_number || "",
        gstinNumber: fullDetails.gstin_number || ""
      });
      
      // Pre-fill location
      if (fullDetails.primary_location) {
        setLocation({
          locationName: fullDetails.primary_location.location_name || "",
          address: fullDetails.primary_location.address || "",
          latitude: fullDetails.primary_location.latitude?.toString() || "",
          longitude: fullDetails.primary_location.longitude?.toString() || "",
          contactNumber: fullDetails.primary_location.contact_number?.replace('+91', '') || "",
          email: fullDetails.primary_location.email || ""
        });
      }
      
      // Pre-fill operating hours
      if (fullDetails.operating_hours) {
        const hours: Record<string, {open: string, close: string, isClosed: boolean}> = {};
        DAYS_OF_WEEK.forEach(day => {
          const dayData = fullDetails.operating_hours[day];
          if (dayData) {
            hours[day] = {
              open: dayData.open_time?.substring(0, 5) || "09:00",
              close: dayData.close_time?.substring(0, 5) || "22:00",
              isClosed: dayData.is_closed || false
            };
          } else {
            hours[day] = { open: "09:00", close: "22:00", isClosed: false };
          }
        });
        setOperatingHours(hours);
      }
      
      // Pre-fill bank details
      if (fullDetails.bank_account_details) {
        setBankDetails({
          accountNumber: fullDetails.bank_account_details.accountNumber || "",
          ifscCode: fullDetails.bank_account_details.ifscCode || "",
          accountHolderName: fullDetails.bank_account_details.accountHolderName || "",
          bankName: fullDetails.bank_account_details.bankName || ""
        });
      }
      
      // Pre-fill cuisines
      setSelectedCuisineIds(fullDetails.cuisines ? fullDetails.cuisines.map((c: any) => c.id) : []);
      
      setOpenEdit(true);
    } catch (error) {
      console.error('Error loading restaurant details:', error);
      alert('Failed to load restaurant details');
    }
  };

  const handleUpdate = async () => {
    if (!selectedRestaurant) return;
    
    try {
      setEditing(true);
      
      // Validate cuisines
      if (selectedCuisineIds.length === 0) {
        alert("Please select at least one cuisine");
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
        day_of_week: day,
        open_time: operatingHours[day].isClosed ? null : operatingHours[day].open + ':00',
        close_time: operatingHours[day].isClosed ? null : operatingHours[day].close + ':00',
        is_closed: operatingHours[day].isClosed
      }));
      
      // Update restaurant profile (basic info, location, hours, bank)
      await adminApi.updateRestaurantProfile(selectedRestaurant.restaurant_id, {
        restaurantName: formR.restaurantName,
        contactPersonName: formR.contactPersonName,
        fssaiLicenseNumber: formR.fssaiLicenseNumber || undefined,
        gstinNumber: formR.gstinNumber || undefined,
        bankAccountDetails,
        primaryLocation: {
          locationName: location.locationName || formR.restaurantName,
          address: location.address,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          contactNumber: location.contactNumber ? `+91${location.contactNumber}` : undefined,
          email: location.email || undefined
        },
        operatingHours: hoursArray
      });
      
      // Update cuisines
      await adminApi.updateRestaurantCuisines(selectedRestaurant.restaurant_id, selectedCuisineIds);
      
      // Refresh list
      const updatedRestaurants = await adminApi.getAllRestaurants();
      setRestaurants(updatedRestaurants);
      setOpenEdit(false);
      resetForm();
      alert("Restaurant updated successfully!");
    } catch (error) {
      console.error('Update failed', error);
      alert(`Failed to update restaurant: ${error}`);
    } finally {
      setEditing(false);
    }
  };

  const openDeleteDialog = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    
    try {
      setDeleting(true);
      await adminApi.deleteRestaurant(selectedRestaurant.restaurant_id);
      
      // Refresh list
      const updatedRestaurants = await adminApi.getAllRestaurants();
      setRestaurants(updatedRestaurants);
      setDeleteConfirm(false);
      setSelectedRestaurant(null);
      alert("Restaurant deleted successfully!");
    } catch (error) {
      console.error('Delete failed', error);
      alert(`Failed to delete restaurant: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (restaurantId: string, newStatus: string) => {
    try {
      await adminApi.updateRestaurantStatus(restaurantId, newStatus as any);
      
      // Refresh list
      const updatedRestaurants = await adminApi.getAllRestaurants();
      setRestaurants(updatedRestaurants);
    } catch (error) {
      console.error('Status update failed', error);
      alert(`Failed to update status: ${error}`);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-4">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                        <Input 
                          value={formR.phoneNumber} 
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setFormR({...formR, phoneNumber: value});
                            }
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Enter 10-digit mobile number</p>
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
                  
                  {/* Cuisine Selection */}
                  <div className="mt-4">
                    <MultiSelect
                      label="Cuisines *"
                      options={cuisines}
                      selected={selectedCuisineIds}
                      onChange={setSelectedCuisineIds}
                      placeholder="Select cuisines..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Search and select multiple cuisines. At least one is required.
                    </p>
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
                      <p className="text-xs text-muted-foreground mt-1">Enter the full address and click the button below to get coordinates</p>
                    </div>
                    <div className="col-span-2">
                      <Button 
                        type="button"
                        onClick={handleGeocodeAddress} 
                        disabled={!location.address || geocoding}
                        className="w-full gap-2"
                        variant="secondary"
                      >
                        {geocoding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting Coordinates...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            Get Coordinates from Address
                          </>
                        )}
                      </Button>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Latitude *</label>
                      <Input 
                        type="text" 
                        value={location.latitude} 
                        readOnly 
                        placeholder="Auto-filled from address"
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-populated from address</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Longitude *</label>
                      <Input 
                        type="text" 
                        value={location.longitude} 
                        readOnly 
                        placeholder="Auto-filled from address"
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-populated from address</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location Contact</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                        <Input 
                          value={location.contactNumber} 
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setLocation({...location, contactNumber: value});
                            }
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                        />
                      </div>
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
                <Button disabled={creating || !isFormValid()} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Restaurant'}
                </Button>
              </div>
              {!isFormValid() && (
                <p className="text-xs text-amber-600 text-right mt-2">
                  Please fill all required fields including address coordinates and at least one cuisine
                </p>
              )}
            </DialogContent>
          </Dialog>
          </div>
          <div className="flex gap-2">
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, email, or phone"
              className="max-w-md"
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((r) => (
                  <TableRow 
                    key={r.restaurant_id}
                  >
                    <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => openRestaurantDetail(r)}>{r.restaurant_name || 'N/A'}</TableCell>
                    <TableCell>{r.contact_person_name || 'N/A'}</TableCell>
                    <TableCell>{r.user_email || 'N/A'}</TableCell>
                    <TableCell>{r.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Select value={r.status || 'pending'} onValueChange={(value) => handleStatusChange(r.restaurant_id, value)}>
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
                    <TableCell>{r.average_rating || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={r.documents_verified ? "default" : "secondary"}>
                        {r.documents_verified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(r)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDeleteDialog(r)}
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

      {/* Restaurant Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Restaurant Details
            </DialogTitle>
          </DialogHeader>
          {selectedRestaurant && (
            <div className="grid gap-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Restaurant Name</label>
                    <div className="text-sm mt-1">{selectedRestaurant.restaurant_name || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                    <div className="text-sm mt-1">{selectedRestaurant.contact_person_name || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="text-sm mt-1">{selectedRestaurant.user_email || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="text-sm mt-1">{selectedRestaurant.phone_number || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">FSSAI License</label>
                    <div className="text-sm mt-1">{selectedRestaurant.fssai_license_number || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                    <div className="text-sm mt-1">{selectedRestaurant.gstin_number || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="text-sm mt-1">
                      <Badge variant={
                        selectedRestaurant.status === "approved" ? "default" :
                        selectedRestaurant.status === "rejected" ? "destructive" :
                        "secondary"
                      }>
                        {selectedRestaurant.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Average Rating</label>
                    <div className="text-sm mt-1">{selectedRestaurant.average_rating || '0.0'} ⭐</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Documents Verified</label>
                    <div className="text-sm mt-1">
                      <Badge variant={selectedRestaurant.documents_verified ? "default" : "secondary"}>
                        {selectedRestaurant.documents_verified ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <div className="text-sm mt-1">
                      {selectedRestaurant.created_at ? new Date(selectedRestaurant.created_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuisines */}
              {selectedRestaurant.cuisines && selectedRestaurant.cuisines.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Cuisines</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.cuisines.map((cuisine: any) => (
                      <Badge key={cuisine.id} variant="secondary">
                        {cuisine.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* IDs */}
              <div>
                <h3 className="font-semibold mb-3">System IDs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Restaurant ID</label>
                    <div className="text-xs mt-1 font-mono">{selectedRestaurant.restaurant_id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <div className="text-xs mt-1 font-mono">{selectedRestaurant.user_id}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Restaurant Dialog */}
      <Dialog open={openEdit} onOpenChange={(open) => { 
        setOpenEdit(open); 
        if (!open) resetForm(); 
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>
              Update details for {selectedRestaurant?.restaurant_name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="hours">Hours</TabsTrigger>
              <TabsTrigger value="cuisines">Cuisines</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Restaurant Name *</label>
                  <Input value={formR.restaurantName} onChange={e => setFormR({...formR, restaurantName: e.target.value})} placeholder="Tasty Bites" />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input value={formR.contactPersonName} onChange={e => setFormR({...formR, contactPersonName: e.target.value})} placeholder="Manager name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={formR.email} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                    <Input value={formR.phoneNumber} disabled className="bg-muted cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Phone cannot be changed</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Enter the full address and click below to update coordinates</p>
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button"
                    onClick={handleGeocodeAddress} 
                    disabled={!location.address || geocoding}
                    className="w-full gap-2"
                    variant="secondary"
                  >
                    {geocoding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting Coordinates...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        Update Coordinates from Address
                      </>
                    )}
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium">Latitude *</label>
                  <Input 
                    type="text" 
                    value={location.latitude} 
                    readOnly 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Longitude *</label>
                  <Input 
                    type="text" 
                    value={location.longitude} 
                    readOnly 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location Contact</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-2 bg-muted rounded-md">+91</span>
                    <Input 
                      value={location.contactNumber} 
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setLocation({...location, contactNumber: value});
                        }
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
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
            
            {/* Cuisines Tab */}
            <TabsContent value="cuisines" className="space-y-4">
              <MultiSelect
                label="Cuisines *"
                options={cuisines}
                selected={selectedCuisineIds}
                onChange={setSelectedCuisineIds}
                placeholder="Select cuisines..."
              />
              <p className="text-xs text-muted-foreground">
                Search and select multiple cuisines. At least one is required.
              </p>
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
              disabled={editing || !formR.restaurantName} 
              onClick={handleUpdate}
            >
              {editing ? 'Updating...' : 'Update Restaurant'}
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
              Are you sure you want to delete <strong>{selectedRestaurant?.restaurant_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone. This will permanently delete the restaurant,
              all its data, and the associated user account.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              disabled={deleting} 
              onClick={handleDelete}
            >
              {deleting ? 'Deleting...' : 'Delete Restaurant'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
