import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Users,
  IndianRupee,
  Search,
  Plus,
  Filter,
  LogOut,
  type LucideIcon,
} from "lucide-react";

// --- Mock Data for Finance Charts (keeping as requested) ---
const kpi = {
  ordersToday: 4260,
  gmV: 28.6, // in crores
  aov: 482,
  onTime: 93,
};

const revenueSeries = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  revenue: 1.8 + Math.random() * 1.6,
  orders: 240 + Math.round(Math.random() * 140),
}));

const cities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai"];
const cityMix = cities.map((c) => ({ city: c, orders: 200 + Math.round(Math.random() * 400) }));

const cuisines = ["North Indian", "South Indian", "Chinese", "Italian", "Desserts", "Fast Food"];

// --- Small UI helpers ---
type StatCardProps = {
    icon: LucideIcon;
    title: string;
    value: React.ReactNode;
    suffix?: string;
    delta?: number;
    className?: string;
    };
function StatCard({ icon: Icon, title, value, suffix="", delta, className = "" }: StatCardProps) {
  return (
    <Card className={`rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold flex items-baseline gap-1">
          <span>{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {typeof delta !== "undefined" && (
          <div className={`mt-1 text-xs ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta >= 0 ? "+" : ""}
            {delta}% vs last week
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopBar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth");
    navigate("/login");
  };

  return (
    <div className="h-16 flex items-center justify-between border-b px-4 lg:px-6 bg-background/60 backdrop-blur">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <LayoutDashboard className="h-6 w-6" />
        Admin
      </div>
      <div className="flex items-center gap-2 w-full max-w-xl">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search orders, restaurants, riders..." className="pl-9" />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4"/>Add Restaurant</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add new restaurant</DialogTitle>
              <DialogDescription>Quickly onboard a partner restaurant. Basic fields only (mock).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <Input placeholder="Restaurant name" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="City" />
                <Select>
                  <SelectTrigger><SelectValue placeholder="Cuisine" /></SelectTrigger>
                  <SelectContent>
                    {cuisines.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

type SidebarProps = { active: string; setActive: (key: string) => void };
function Sidebar({ active, setActive }: SidebarProps) {
  const items = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { key: "riders", label: "Delivery Partners", icon: Bike },
    { key: "bags", label: "Surprise Bags", icon: ShoppingBag },
    { key: "customers", label: "Users", icon: Users },
    { key: "finance", label: "Finance", icon: IndianRupee },
  ];
  return (
    <div className="w-64 border-r hidden md:flex md:flex-col p-3 gap-1 bg-background/60">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
            active === key ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalRestaurants: 0,
    totalUsers: 0,
    totalBags: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const [orders, restaurants, users, bags] = await Promise.all([
          adminApi.getAllOrders(),
          adminApi.getAllRestaurants(),
          adminApi.getAllUsers(),
          adminApi.getAllSurpriseBags(),
        ]);

        if (!isMounted) return;

        const totalRevenue = orders.orders.reduce((sum, order: any) => sum + (Number(order.total_amount) || 0), 0);

        setStats({
          totalOrders: orders.orders.length,
          totalRevenue,
          totalRestaurants: restaurants.length,
          totalUsers: users.length,
          totalBags: bags.length,
          loading: false,
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching overview stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchStats();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <StatCard 
          icon={ShoppingBag} 
          title="Total Orders" 
          value={stats.loading ? "..." : stats.totalOrders.toLocaleString()} 
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <StatCard 
          icon={IndianRupee} 
          title="Total Revenue" 
          value={stats.loading ? "..." : `₹${stats.totalRevenue.toFixed(2)}`}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <StatCard 
          icon={UtensilsCrossed} 
          title="Restaurants" 
          value={stats.loading ? "..." : stats.totalRestaurants} 
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <StatCard 
          icon={Users} 
          title="Total Users" 
          value={stats.loading ? "..." : stats.totalUsers} 
        />
      </motion.div>

      <Card className="lg:col-span-3 rounded-2xl">
        <CardHeader>
          <CardTitle>Revenue & Orders (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ReTooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" fillOpacity={0.3} />
              <Line yAxisId="right" type="monotone" dataKey="orders" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Orders by City (today)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityMix}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <ReTooltip />
              <Bar dataKey="orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Orders() {
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

function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>Partner Restaurants</CardTitle></CardHeader>
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

function Riders() {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>Delivery Partners</CardTitle></CardHeader>
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

function Finance() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <StatCard icon={IndianRupee} title="Revenue (MTD)" value={`₹${(kpi.gmV * 10).toFixed(1)}Cr`} delta={5.6} />
      <StatCard icon={ShoppingBag} title="Refund Rate" value={`0.${Math.round(Math.random()*9)}%`} delta={-0.3} />
      <StatCard icon={Users} title="New Users (MTD)" value={"48,120"} delta={2.1} />

      <Card className="lg:col-span-2 rounded-2xl">
        <CardHeader><CardTitle>GMV Trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>City Mix</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityMix}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <ReTooltip />
              <Bar dataKey="orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Customers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async () => {
      try {
        const data = await adminApi.getAllUsers();
        if (!isMounted) return;
        setUsers(data);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching users:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUsers();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>All Users</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || 'N/A'}</TableCell>
                    <TableCell>{u.email || 'N/A'}</TableCell>
                    <TableCell>{u.phone_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.user_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_verified ? "default" : "secondary"}>
                        {u.is_verified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "default" : "destructive"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
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

function SurpriseBags() {
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBags = async () => {
      try {
        const data = await adminApi.getAllSurpriseBags();
        if (!isMounted) return;
        setBags(data);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching surprise bags:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchBags();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>Surprise Bags</CardTitle></CardHeader>
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

export default function Dashboard() {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground">
      {/* Top Bar */}
      <TopBar />

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-0">
        {/* Sidebar */}
        <Sidebar active={active} setActive={setActive} />

        {/* Main */}
        <main className="p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl lg:text-3xl font-bold capitalize">{active}</h1>
            <div className="flex items-center gap-2">
              <Select defaultValue="Today">
                <SelectTrigger className="w-40"><SelectValue placeholder="Date Range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="All Cities">
                <SelectTrigger className="w-40"><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Cities">All Cities</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={active} onValueChange={setActive} className="hidden">
            <TabsList className="hidden">
              <TabsTrigger value="overview" />
              <TabsTrigger value="orders" />
              <TabsTrigger value="restaurants" />
              <TabsTrigger value="riders" />
              <TabsTrigger value="bags" />
              <TabsTrigger value="customers" />
              <TabsTrigger value="finance" />
            </TabsList>
          </Tabs>

          {/* Views */}
          {active === "overview" && <Overview />}
          {active === "orders" && <Orders />}
          {active === "restaurants" && <Restaurants />}
          {active === "riders" && <Riders />}
          {active === "bags" && <SurpriseBags />}
          {active === "customers" && <Customers />}
          {active === "finance" && <Finance />}
        </main>
      </div>

      <footer className="text-xs text-muted-foreground px-6 py-8">
        Admin Dashboard - Real-time data from Fozo Backend API
      </footer>
    </div>
  );
}
