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
    availableDate: ""
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

  const handleCreate = async () => {
    try {
      setCreating(true);
      await adminApi.createSurpriseBag({
        targetRestaurantId: formB.targetRestaurantId,
        bagName: formB.bagName,
        denominationValue: Number(formB.denominationValue),
        actualWorth: Number(formB.actualWorth),
        description: formB.description || undefined,
        imageUrl: formB.imageUrl || undefined,
        quantityAvailable: Number(formB.quantityAvailable),
        pickupStartTime: formB.pickupStartTime + ':00',
        pickupEndTime: formB.pickupEndTime + ':00',
        availableDate: formB.availableDate || undefined,
      });
      setBags(await adminApi.getAllSurpriseBags());
      setOpenAdd(false);
    } catch (err) {
      console.error('Create surprise bag failed', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Surprise Bags</CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4"/>Add Surprise Bag</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Surprise Bag</DialogTitle>
                <DialogDescription>Create a bag for a specific restaurant.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Restaurant</label>
                  <Select value={formB.targetRestaurantId} onValueChange={(v) => setFormB({ ...formB, targetRestaurantId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                    <SelectContent>
                      {restaurants.map(r => (
                        <SelectItem key={r.restaurant_id} value={r.restaurant_id}>
                          {r.restaurant_name || r.user_email || 'Unnamed'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Bag Name</label>
                  <Input value={formB.bagName} onChange={(e) => setFormB({ ...formB, bagName: e.target.value })} placeholder="Eg. Dinner Saver" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm">Denomination Value</label>
                    <Input type="number" value={formB.denominationValue} onChange={(e) => setFormB({ ...formB, denominationValue: e.target.value })} placeholder="199" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm">Actual Worth</label>
                    <Input type="number" value={formB.actualWorth} onChange={(e) => setFormB({ ...formB, actualWorth: e.target.value })} placeholder="399" />
                  </div>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Description</label>
                  <Input value={formB.description} onChange={(e) => setFormB({ ...formB, description: e.target.value })} placeholder="Short description" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Image URL</label>
                  <Input value={formB.imageUrl} onChange={(e) => setFormB({ ...formB, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm">Quantity Available</label>
                    <Input type="number" value={formB.quantityAvailable} onChange={(e) => setFormB({ ...formB, quantityAvailable: e.target.value })} placeholder="10" />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm">Available Date</label>
                    <Input type="date" value={formB.availableDate} onChange={(e) => setFormB({ ...formB, availableDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm">Pickup Start Time</label>
                    <Input type="time" value={formB.pickupStartTime} onChange={(e) => setFormB({ ...formB, pickupStartTime: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm">Pickup End Time</label>
                    <Input type="time" value={formB.pickupEndTime} onChange={(e) => setFormB({ ...formB, pickupEndTime: e.target.value })} />
                  </div>
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
            <div className="text-center py-8">Loading surprise bags...</div>
          ) : bags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No surprise bags found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Discounted Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bags.map((bag) => (
                  <TableRow key={bag.id}>
                    <TableCell className="font-medium">{bag.id?.substring(0, 8) || 'N/A'}</TableCell>
                    <TableCell>{bag.restaurant_id?.substring(0, 8) || 'N/A'}</TableCell>
                    <TableCell>₹{Number(bag.original_price || 0).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(bag.discounted_price || 0).toFixed(2)}</TableCell>
                    <TableCell>{bag.quantity_available || 0}</TableCell>
                    <TableCell>{bag.pickup_time_start || 'N/A'} - {bag.pickup_time_end || 'N/A'}</TableCell>
                    <TableCell>{bag.created_at ? new Date(bag.created_at).toLocaleDateString() : 'N/A'}</TableCell>
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

