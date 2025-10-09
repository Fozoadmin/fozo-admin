import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TopBar,
  Sidebar,
  Overview,
  Orders,
  Restaurants,
  DeliveryPartners,
  Customers,
  SurpriseBags,
  Finance,
  Settings,
} from "@/components/dashboard";

const cities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai"];

export default function Dashboard() {
  const [active, setActive] = useState("overview");

  return (
    <div className="h-screen bg-gradient-to-b from-background to-muted/20 text-foreground flex flex-col">
      {/* Top Bar */}
      <TopBar />

      <div className="max-w-[1400px] grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-0 flex-1">
        {/* Sidebar */}
        <Sidebar active={active} setActive={setActive} />

        {/* Main */}
        <main className="p-4 lg:p-6 flex flex-col h-full">
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
              <TabsTrigger value="settings" />
            </TabsList>
          </Tabs>

          {/* Views */}
          <div className="flex-1 overflow-auto">
            {active === "overview" && <Overview />}
            {active === "orders" && <Orders />}
            {active === "restaurants" && <Restaurants />}
            {active === "riders" && <DeliveryPartners />}
            {active === "bags" && <SurpriseBags />}
            {active === "customers" && <Customers />}
            {active === "finance" && <Finance />}
            {active === "settings" && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
}
