import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Plus, Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { apiRequestWithStatus } from "@/lib/utils";

export function SurpriseBags() {
  const [groupedRestaurants, setGroupedRestaurants] = useState<any[]>([]);
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Restaurant search
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  
  const [formB, setFormB] = useState({
    bagName: "",
    denominationValue: "",
    actualWorth: "",
    description: "",
    imageUrl: "",
    quantityAvailable: "",
    pickupStartTime: "",
    pickupEndTime: "",
    availableDate: "",
    isActive: true,
    isVegetarian: true
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const groupedData = await adminApi.getGroupedSurpriseBags();
        if (!isMounted) return;
        setGroupedRestaurants(groupedData);
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

  const toggleRestaurant = (restaurantId: string) => {
    setExpandedRestaurants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(restaurantId)) {
        newSet.delete(restaurantId);
      } else {
        newSet.add(restaurantId);
      }
      return newSet;
    });
  };

  // Search restaurants
  const handleSearchRestaurants = async () => {
    if (!restaurantSearch.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await adminApi.getAllRestaurants(restaurantSearch);
      setSearchResults(results.filter(r => r.status === 'approved'));
    } catch (error) {
      console.error('Error searching restaurants:', error);
      alert('Failed to search restaurants');
    } finally {
      setSearching(false);
    }
  };

  const selectRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setSearchResults([]);
    setRestaurantSearch("");
  };

  const clearSelectedRestaurant = () => {
    setSelectedRestaurant(null);
  };

  const resetForm = () => {
    setFormB({
      bagName: "",
      denominationValue: "",
      actualWorth: "",
      description: "",
      imageUrl: "",
      quantityAvailable: "",
      pickupStartTime: "",
      pickupEndTime: "",
      availableDate: "",
      isActive: true,
      isVegetarian: true
    });
    setSelectedRestaurant(null);
    setRestaurantSearch("");
    setSearchResults([]);
  };

  const isFormValid = () => {
    return selectedRestaurant && formB.bagName && formB.denominationValue && 
           formB.actualWorth && formB.quantityAvailable;
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      
      if (!selectedRestaurant) {
        alert("Please search and select a restaurant");
        return;
      }
      
      if (!formB.bagName || !formB.denominationValue || !formB.actualWorth || !formB.quantityAvailable) {
        alert("Please fill in all required fields");
        return;
      }

      // Use helper to get status code
      const result = await apiRequestWithStatus('/bags', {
        method: 'POST',
        body: JSON.stringify({
          targetRestaurantId: selectedRestaurant.restaurantId || selectedRestaurant.id,
          bagName: formB.bagName,
          denominationValue: parseFloat(formB.denominationValue),
          actualWorth: parseFloat(formB.actualWorth),
          description: formB.description || undefined,
          imageUrl: formB.imageUrl || undefined,
          quantityAvailable: parseInt(formB.quantityAvailable),
          pickupStartTime: formB.pickupStartTime ? formB.pickupStartTime + ':00' : undefined,
          pickupEndTime: formB.pickupEndTime ? formB.pickupEndTime + ':00' : undefined,
          availableDate: formB.availableDate || undefined,
          isActive: formB.isActive,
          isVegetarian: formB.isVegetarian
        })
      });
      
      // Show toast based on status
      if (result.status < 300) {
        toast.success(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
        setGroupedRestaurants(await adminApi.getGroupedSurpriseBags());
        setOpenAdd(false);
        resetForm();
      } else {
        // Show red toast for any error status (status >= 400)
        toast.error(result.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      console.error('Create surprise bag failed', err);
      // Show error toast for unexpected errors
      const errorMessage = err?.message || "Failed to create surprise bag";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
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
                <DialogDescription>Search for a restaurant and create a surprise bag</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4">
                {/* Restaurant Search */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Search Restaurant *</label>
                  {selectedRestaurant ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                      <div>
                        <div className="font-medium">{selectedRestaurant.restaurantName}</div>
                        <div className="text-sm text-muted-foreground">{selectedRestaurant.userEmail || selectedRestaurant.phoneNumber}</div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={clearSelectedRestaurant}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input 
                          value={restaurantSearch} 
                          onChange={(e) => setRestaurantSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchRestaurants()}
                          placeholder="Search by name, email, or phone" 
                        />
                        <Button onClick={handleSearchRestaurants} disabled={searching} className="gap-2">
                          <Search className="h-4 w-4" />
                          {searching ? 'Searching...' : 'Search'}
                        </Button>
                      </div>
                      {searchResults.length > 0 && (
                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                          {searchResults.map((restaurant) => (
                            <div
                              key={restaurant.restaurantId}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => selectRestaurant(restaurant)}
                            >
                              <div className="font-medium">{restaurant.restaurantName}</div>
                              <div className="text-sm text-muted-foreground">
                                {restaurant.userEmail || restaurant.phoneNumber}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Only approved restaurants will appear in search results
                      </p>
                    </>
                  )}
                </div>

                {/* Bag Details - Only show if restaurant is selected */}
                {selectedRestaurant && (
                  <>
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
                      
                      {/* <div className="col-span-2">
                        <label className="text-sm font-medium">Image URL</label>
                        <Input value={formB.imageUrl} onChange={(e) => setFormB({...formB, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" />
                      </div> */}
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
                        <label className="text-sm font-medium">Available Till Date</label>
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

                    {/* Vegetarian Status */}
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="bagVegetarian" 
                        checked={formB.isVegetarian} 
                        onChange={(e) => setFormB({...formB, isVegetarian: e.target.checked})} 
                        className="h-4 w-4" 
                      />
                      <label htmlFor="bagVegetarian" className="text-sm font-medium">Vegetarian Bag</label>
                      <p className="text-xs text-muted-foreground">(mark as vegetarian option)</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setOpenAdd(false); resetForm(); }}>Cancel</Button>
                <Button disabled={creating || !isFormValid()} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create Surprise Bag'}
                </Button>
              </div>
              {!isFormValid() && (
                <p className="text-xs text-amber-600 text-right mt-2">
                  Please select a restaurant and fill all required fields
                </p>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading surprise bags...</div>
          ) : groupedRestaurants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No restaurants with surprise bags found</div>
          ) : (
            <div className="space-y-2">
              {groupedRestaurants.map((restaurant) => (
                <div key={restaurant.restaurantId} className="border rounded-lg overflow-hidden">
                  {/* Restaurant Header - Clickable to expand/collapse */}
                  <div
                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleRestaurant(restaurant.restaurantId)}
                  >
                    <div className="flex items-center gap-3">
                      <button className="p-1 hover:bg-muted rounded">
                        {expandedRestaurants.has(restaurant.restaurantId) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <h3 className="font-semibold text-lg">{restaurant.restaurantName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.restaurantOwnerPhone} • {restaurant.totalBags} bag{restaurant.totalBags !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {restaurant.totalBags} Active Listing{restaurant.totalBags !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Expanded Bags Table */}
                  {expandedRestaurants.has(restaurant.restaurantId) && (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bag Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Worth</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Pickup Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {restaurant.bags.map((bag: any) => (
                            <TableRow key={bag.bagId} className="hover:bg-muted/30 font-light">
                              <TableCell className="font-light">{bag.bagName || 'N/A'}</TableCell>
                              <TableCell>₹{Number(bag.denominationValue || 0).toFixed(2)}</TableCell>
                              <TableCell>₹{Number(bag.actualWorth || 0).toFixed(2)}</TableCell>
                              <TableCell>{bag.quantityAvailable || 0}</TableCell>
                              <TableCell className="text-sm">
                                {bag.pickupTime || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={bag.isActive ? "default" : "secondary"}>
                                  {bag.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {bag.availableDate ? new Date(bag.availableDate).toLocaleDateString() : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
