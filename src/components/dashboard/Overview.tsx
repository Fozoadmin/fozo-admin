import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { adminApi } from "@/lib/api";
import { StatCard } from "./StatCard";
import { ShoppingBag, IndianRupee, UtensilsCrossed, Users } from "lucide-react";

export function Overview() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalRestaurants: 0,
    totalCustomers: 0,
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
          adminApi.getAllUsers('customer'),
          adminApi.getAllSurpriseBags(),
        ]);

        if (!isMounted) return;

        const totalRevenue = orders.orders.reduce((sum, order: any) => sum + (Number(order.total_amount) || 0), 0);

        setStats({
          totalOrders: orders.orders.length,
          totalRevenue,
          totalRestaurants: restaurants.length,
          totalCustomers: users.length,
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
    <div className="h-full w-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 w-full">
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
            title="Total Customers" 
            value={stats.loading ? "..." : stats.totalCustomers} 
          />
        </motion.div>
      </div>
    </div>
  );
}

