import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export function SurpriseBags() {
  const [bags, setBags] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [formB, setFormB] = useState({
    targetRestaurantId: "",
    bagName: "",
    denominationValue: "",
    actualWorth: "",
    description: "",
    imageUrl: "",
    quantityAvailable: "",
    pickupStartTime: "",
    pickupEndTime: "",
    availableDate: "",
    isActive: true
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const [bagsData, restaurantsData] = await Promise.all([
          adminApi.getAllSurpriseBags(),
          adminApi.getAllRestaurants()
        ]);
        if (!isMounted) return;
        setBags(bagsData);
        setRestaurants(restaurantsData);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching surprise bags:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setFormB({
      targetRestaurantId: "",
      bagName: "",
      denominationValue: "",
      actualWorth: "",
      description: "",
      imageUrl: "",
      quantityAvailable: "",
      pickupStartTime: "",
      pickupEndTime: "",
      availableDate: "",
      isActive: true
    });
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      
      if (!formB.targetRestaurantId) {
        alert("Please select a restaurant");
        return;
      }
      
      if (!formB.bagName || !formB.denominationValue || !formB.actualWorth || !formB.quantityAvailable) {
        alert("Please fill in all required fields");
        return;
      }

      await adminApi.createSurpriseBag({
        targetRestaurantId: formB.targetRestaurantId,
        bagName: formB.bagName,
        denominationValue: parseFloat(formB.denominationValue),
        actualWorth: parseFloat(formB.actualWorth),
        description: formB.description || undefined,
        imageUrl: formB.imageUrl || undefined,
        quantityAvailable: parseInt(formB.quantityAvailable),
        pickupStartTime: formB.pickupStartTime ? formB.pickupStartTime + ':00' : undefined,
        pickupEndTime: formB.pickupEndTime ? formB.pickupEndTime + ':00' : undefined,
        availableDate: formB.availableDate || undefined,
        isActive: formB.isActive
      });
      
      setBags(await adminApi.getAllSurpriseBags());
      setOpenAdd(false);
      resetForm();
    } catch (err) {
      console.error('Create surprise bag failed', err);
      alert(`Failed to create surprise bag: ${err}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Surprise Bags</CardTitle>
          <Dialog open={openAdd} onOpenChange={(open) => { setOpenAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/>Add Surprise Bag</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Surprise Bag</DialogTitle>
                <DialogDescription>Create a surprise bag for a restaurant</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4">
                {/* Restaurant Selection */}
                <div>
                  <label className="text-sm font-medium">Restaurant *</label>
                  <Select value={formB.targetRestaurantId} onValueChange={(v) => setFormB({...formB, targetRestaurantId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                    <SelectContent>
                      {restaurants.filter(r => r.status === 'approved').map(r => (
                        <SelectItem key={r.restaurant_id} value={r.restaurant_id}>
                          {r.restaurant_name || r.user_email || 'Unnamed'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Only approved restaurants are shown</p>
                </div>

                {/* Bag Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Bag Name *</label>
                    <Input value={formB.bagName} onChange={(e) => setFormB({...formB, bagName: e.target.value})} placeholder="e.g., Dinner Surprise Pack" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Customer Pays (₹) *</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formB.denominationValue} 
                      onChange={(e) => setFormB({...formB, denominationValue: e.target.value})} 
                      placeholder="199.00" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Price customer will pay</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Actual Worth (₹) *</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formB.actualWorth} 
                      onChange={(e) => setFormB({...formB, actualWorth: e.target.value})} 
                      placeholder="399.00" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Original value of items</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={formB.description} onChange={(e) => setFormB({...formB, description: e.target.value})} placeholder="Brief description of the bag contents" />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Image URL</label>
                    <Input value={formB.imageUrl} onChange={(e) => setFormB({...formB, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" />
                  </div>
                </div>

                {/* Availability */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity Available *</label>
                    <Input 
                      type="number" 
                      value={formB.quantityAvailable} 
                      onChange={(e) => setFormB({...formB, quantityAvailable: e.target.value})} 
                      placeholder="10" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Number of bags available</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Available Date</label>
                    <Input 
                      type="date" 
                      value={formB.availableDate} 
                      onChange={(e) => setFormB({...formB, availableDate: e.target.value})} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty for today</p>
                  </div>
                </div>

                {/* Pickup Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Pickup Start Time</label>
                    <Input 
                      type="time" 
                      value={formB.pickupStartTime} 
                      onChange={(e) => setFormB({...formB, pickupStartTime: e.target.value})} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Pickup End Time</label>
                    <Input 
                      type="time" 
                      value={formB.pickupEndTime} 
                      onChange={(e) => setFormB({...formB, pickupEndTime: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="bagActive" 
                    checked={formB.isActive} 
                    onChange={(e) => setFormB({...formB, isActive: e.target.checked})} 
                    className="h-4 w-4" 
                  />
                  <label htmlFor="bagActive" className="text-sm font-medium">Bag is Active</label>
                  <p className="text-xs text-muted-foreground">(customers can see and purchase)</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setOpenAdd(false); resetForm(); }}>Cancel</Button>
                <Button disabled={creating} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Surprise Bag'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading surprise bags...</div>
          ) : bags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No surprise bags found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag Name</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Worth</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bags.map((bag) => (
                  <TableRow key={bag.id}>
                    <TableCell className="font-medium">{bag.bag_name || 'N/A'}</TableCell>
                    <TableCell>{bag.restaurant_id?.substring(0, 8) || 'N/A'}</TableCell>
                    <TableCell>₹{Number(bag.denomination_value || 0).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(bag.actual_worth || 0).toFixed(2)}</TableCell>
                    <TableCell>{bag.quantity_available || 0}</TableCell>
                    <TableCell className="text-sm">
                      {bag.pickup_start_time && bag.pickup_end_time 
                        ? `${bag.pickup_start_time?.substring(0, 5)} - ${bag.pickup_end_time?.substring(0, 5)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bag.is_active ? "default" : "secondary"}>
                        {bag.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{bag.available_date ? new Date(bag.available_date).toLocaleDateString() : 'N/A'}</TableCell>
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
