import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  Megaphone,
  LifeBuoy,
  Settings,
  Search,
  Plus,
  Filter,
  ChevronRight,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";

// --- Mock Data Generators ---
const cities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai"];
const cuisines = ["North Indian", "South Indian", "Chinese", "Italian", "Desserts", "Fast Food"];

const makeOrders = (n = 15) =>
  Array.from({ length: n }, (_, i) => ({
    id: `ORD-${10000 + i}`,
    customer: ["Aarav", "Vihaan", "Ananya", "Isha", "Kabir", "Tara"][i % 6],
    restaurant: ["Spice Route", "Urban Dosa", "Dragon Bowl", "Bombay Bites"][i % 4],
    city: cities[i % cities.length],
    items: Math.ceil(Math.random() * 5) + 1,
    value: Math.round(150 + Math.random() * 850),
    status: ["Placed", "Preparing", "On the way", "Delivered", "Cancelled"][i % 5],
    eta: `${15 + (i % 5) * 5} min`,
    time: `${9 + (i % 12)}:${["00", "15", "30", "45"][i % 4]}`,
  }));

const orders = makeOrders(24);

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

const cityMix = cities.map((c) => ({ city: c, orders: 200 + Math.round(Math.random() * 400) }));

const restaurants = Array.from({ length: 10 }, (_, i) => ({
  id: `RST-${900 + i}`,
  name: ["Spice Route", "Urban Dosa", "Dragon Bowl", "Bombay Bites", "Punjab Grill", "Chaat Central", "Tandoori Town", "Pasta Punto", "Sugar & Spice", "Gongfu Wok"][i],
  city: cities[i % cities.length],
  cuisine: cuisines[i % cuisines.length],
  rating: (3.6 + Math.random() * 1.4).toFixed(1),
  active: Math.random() > 0.1,
  avgPrep: 12 + Math.round(Math.random() * 20),
}));

const riders = Array.from({ length: 8 }, (_, i) => ({
  id: `DLV-${700 + i}`,
  name: ["Rahul", "Suman", "Karthik", "Meera", "Imran", "Deepa", "Vikram", "Neha"][i],
  city: cities[i % cities.length],
  online: Math.random() > 0.3,
  onTrip: Math.random() > 0.5,
  rating: (3.5 + Math.random() * 1.5).toFixed(1),
}));

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
    { key: "riders", label: "Riders", icon: Bike },
    { key: "customers", label: "Customers", icon: Users },
    { key: "finance", label: "Finance", icon: IndianRupee },
    { key: "promotions", label: "Promotions", icon: Megaphone },
    { key: "support", label: "Support", icon: LifeBuoy },
    { key: "settings", label: "Settings", icon: Settings },
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
      <div className="mt-auto grid grid-cols-2 gap-2 text-xs p-1">
        <Button variant="secondary" className="gap-1"><ChevronLeft className="h-3 w-3"/>Prev</Button>
        <Button variant="secondary" className="gap-1">Next<ChevronRight className="h-3 w-3"/></Button>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <StatCard icon={ShoppingBag} title="Orders Today" value={kpi.ordersToday.toLocaleString()} delta={4.2} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <StatCard icon={IndianRupee} title="GMV" value={kpi.gmV} suffix="Cr" delta={3.1} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <StatCard icon={UtensilsCrossed} title="AOV" value={`₹${kpi.aov}`} delta={-1.3} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <StatCard icon={Bike} title="On-time Delivery" value={`${kpi.onTime}%`} delta={1.1} />
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
  const filtered = useMemo(() => orders.filter(o => status === "all" ? true : o.status === status), [status]);
  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <Input placeholder="Search by ID, cust, resto" />
            <Button variant="secondary" className="gap-2"><Filter className="h-4 w-4"/>Filter</Button>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {(["all", "Placed", "Preparing", "On the way", "Delivered", "Cancelled"]).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="Mumbai">
            <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-0"><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell>{o.restaurant}</TableCell>
                  <TableCell>{o.city}</TableCell>
                  <TableCell>{o.items}</TableCell>
                  <TableCell>₹{o.value}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === "Delivered" ? "default" : o.status === "Cancelled" ? "destructive" : "secondary"}>{o.status}</Badge>
                  </TableCell>
                  <TableCell>{o.eta}</TableCell>
                  <TableCell>{o.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>{filtered.length} orders listed</TableCaption>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Restaurants() {
  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>Partner Restaurants</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avg Prep (min)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.id}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.city}</TableCell>
                  <TableCell>{r.cuisine}</TableCell>
                  <TableCell>{r.rating}</TableCell>
                  <TableCell>
                    <Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Active" : "Paused"}</Badge>
                  </TableCell>
                  <TableCell>{r.avgPrep}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Riders() {
  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle>Rider Fleet</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Online</TableHead>
                <TableHead>On Trip</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.id}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.city}</TableCell>
                  <TableCell>
                    <Badge variant={d.online ? "default" : "secondary"}>{d.online ? "Online" : "Offline"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.onTrip ? "default" : "secondary"}>{d.onTrip ? "Yes" : "No"}</Badge>
                  </TableCell>
                  <TableCell>{d.rating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

type PlaceholderProps = { title: string };
function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="grid place-items-center h-64">
      <div className="text-center">
        <div className="text-xl font-semibold mb-2">{title}</div>
        <p className="text-muted-foreground">This section is a placeholder in the mockup. Add your own components and flows here.</p>
      </div>
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
              <TabsTrigger value="customers" />
              <TabsTrigger value="finance" />
              <TabsTrigger value="promotions" />
              <TabsTrigger value="support" />
              <TabsTrigger value="settings" />
            </TabsList>
          </Tabs>

          {/* Views */}
          {active === "overview" && <Overview />}
          {active === "orders" && <Orders />}
          {active === "restaurants" && <Restaurants />}
          {active === "riders" && <Riders />}
          {active === "customers" && <Placeholder title="Customers" />}
          {active === "finance" && <Finance />}
          {active === "promotions" && <Placeholder title="Promotions" />}
          {active === "support" && <Placeholder title="Support" />}
          {active === "settings" && <Placeholder title="Settings" />}
        </main>
      </div>

      <footer className="text-xs text-muted-foreground px-6 py-8">
        Mock data for demo purposes. Replace with real analytics, order feeds, and partner data.
      </footer>
    </div>
  );
}
