import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Filter } from "lucide-react";

export function Orders() {
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async () => {
      try {
        const data = await adminApi.getAllOrders();
        if (!isMounted) return;
        setOrders(data.orders);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching orders:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchOrders();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => 
    status === "all" ? orders : orders.filter(o => o.order_status === status), 
    [orders, status]
  );

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Input placeholder="Search by ID, customer, restaurant" />
            <Button variant="secondary" className="gap-2"><Filter className="h-4 w-4"/>Filter</Button>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-0"><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.id.substring(0, 8)}</TableCell>
                    <TableCell>{o.customer_name || 'N/A'}</TableCell>
                    <TableCell>{o.restaurant_name || 'N/A'}</TableCell>
                    <TableCell>₹{Number(o.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        o.order_status === "delivered" ? "default" : 
                        o.order_status === "cancelled" ? "destructive" : 
                        "secondary"
                      }>
                        {o.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(o.order_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{filtered.length} orders listed</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

