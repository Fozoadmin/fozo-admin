import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./StatCard";
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
} from "recharts";
import { IndianRupee, ShoppingBag, Users } from "lucide-react";

// Mock Data for Finance Charts
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

export function Finance() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={IndianRupee} title="Revenue (MTD)" value={`₹${(kpi.gmV * 10).toFixed(1)}Cr`} delta={5.6} />
        <StatCard icon={ShoppingBag} title="Refund Rate" value={`0.${Math.round(Math.random() * 9)}%`} delta={-0.3} />
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
    </div>
  );
}

