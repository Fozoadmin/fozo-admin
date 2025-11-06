import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, Filter, Loader2, MapPin, Phone, User2, Truck, IndianRupee, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------ Types ------------------
export type Order = {
  id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id: string | null;
  total_bag_amount: string; // "49.00"
  delivery_fee: string; // "0.00"
  platform_commission: string; // "10.00"
  total_payment_amount: string; // "59.00"
  delivery_address_snapshot: string;
  delivery_latitude: string; // "12.929507"
  delivery_longitude: string; // "77.677976"
  customer_phone_snapshot: string;
  customer_email_snapshot: string | null;
  notes_to_restaurant: string | null;
  order_status:
    | "placed"
    | "pending"
    | "confirmed"
    | "ready_for_pickup"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refunded";
  payment_status: "paid" | "pending" | "failed";
  payment_transaction_id: string | null;
  payment_method: string | null;
  order_date: string; // ISO date
  restaurant_confirmed_at: string | null;
  delivery_partner_assigned_at: string | null;
  pickup_time_slot_start: string | null; // "18:00:00"
  pickup_time_slot_end: string | null; // "23:00:00"
  expected_delivery_time: string | null;
  actual_delivery_time: string | null;
  cancellation_reason: string | null;
  cancelled_by_user_type: string | null;
  created_at: string; // ISO date
  updated_at: string; // ISO date
  customer_name: string | null;
  customer_phone: string | null;
  restaurant_name: string | null;
  restaurant_contact_person: string | null;
  delivery_partner_name: string | null;
  delivery_partner_phone: string | null;
};

export type DeliveryPartner = {
  id: string;
  fullName: string;
  phoneNumber?: string;
};

// ------------------ Utils ------------------
const formatINR = (n: number | string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    typeof n === "string" ? Number(n) : n
  );

const timeAgo = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const statusVariant = (s: Order["order_status"]) => {
  switch (s) {
    case "delivered":
      return "default" as const;
    case "cancelled":
    case "refunded":
      return "destructive" as const;
    case "out_for_delivery":
    case "ready_for_pickup":
    case "confirmed":
    case "placed":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const STATUS_OPTIONS: Array<Order["order_status"] | "all"> = [
  "all",
  "placed",
  "pending",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ------------------ Main Component ------------------
export function Orders() {
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [selected, setSelected] = useState<Order | null>(null);

  // Delivery partners for assignment when moving to out_for_delivery
  const [assignOpen, setAssignOpen] = useState(false);
  const [dpList, setDpList] = useState<DeliveryPartner[]>([]);
  const [dpLoading, setDpLoading] = useState(false);
  const [dpError, setDpError] = useState<string | null>(null);
  const [dpSelectedId, setDpSelectedId] = useState<string>("");
  const [pendingOutForDeliveryOrder, setPendingOutForDeliveryOrder] = useState<Order | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await adminApi.getAllOrders();
        if (!isMounted) return;
        const sorted = [...(data?.orders ?? [])].sort(
          (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted as Order[]);
      } catch (e: any) {
        if (!isMounted) return;
        console.error("Error fetching orders:", e);
        setError("Failed to load orders. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch delivery partners when assignment dialog opens
  useEffect(() => {
    let alive = true;
    const fetchDPs = async () => {
      if (!assignOpen) return;
      setDpLoading(true);
      setDpError(null);
      try {
        const rawData = await adminApi.getAllDeliveryPartners(undefined, 'true');
        if (!alive) return;

        const normalized: DeliveryPartner[] = (rawData ?? []).map((d: any) => ({
          id: d.id,
          fullName: d.full_name ?? d.fullName ?? null,
          phoneNumber: d.phone_number ?? d.phoneNumber ?? null,
        }));

        setDpList(normalized);
      } catch (e: any) {
        if (!alive) return;
        setDpError("Failed to load delivery partners");
      } finally {
        if (alive) setDpLoading(false);
      }
    };
    fetchDPs();
    return () => {
      alive = false;
    };
  }, [assignOpen]);

  // Derived counts for quick-glance KPIs
  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    let revenue = 0;
    for (const o of orders) {
      counts[o.order_status] = (counts[o.order_status] ?? 0) + 1;
      revenue += Number(o.total_payment_amount || 0);
    }
    return {
      counts,
      total: orders.length,
      revenue,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let out = orders;
    if (status !== "all") out = out.filter((o) => o.order_status === status);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      out = out.filter((o) => {
        return (
          o.id.toLowerCase().includes(q) ||
          (o.customer_name?.toLowerCase() ?? "").includes(q) ||
          (o.customer_phone?.toLowerCase() ?? "").includes(q) ||
          (o.restaurant_name?.toLowerCase() ?? "").includes(q) ||
          (o.delivery_partner_name?.toLowerCase() ?? "").includes(q)
        );
      });
    }
    return out;
  }, [orders, status, debouncedQuery]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const openMapsUrl = (o: Order) => {
    const lat = o.delivery_latitude;
    const lng = o.delivery_longitude;
    const q = encodeURIComponent(`${lat},${lng}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  };

  // --- Status update handler ---
  const handleStatusChange = async (
    order: Order,
    newStatus: Order["order_status"]
  ) => {
    if (newStatus === "out_for_delivery") {
      // Open assignment dialog; require a DP selection for admins per backend
      setPendingOutForDeliveryOrder(order);
      setDpSelectedId(order.delivery_partner_id || "");
      setAssignOpen(true);
      return;
    }

    const prev = order.order_status;
    setUpdatingStatusId(order.id);
    try {
      // optimistic UI update
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, order_status: newStatus } : o)));
      await adminApi.updateOrderStatus(order.id, newStatus);
      setSelected((sel) => (sel && sel.id === order.id ? { ...sel, order_status: newStatus } : sel));
    } catch (e) {
      // revert on failure
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, order_status: prev } : o)));
      setSelected((sel) => (sel && sel.id === order.id ? { ...sel, order_status: prev } : sel));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // --- Confirm out_for_delivery with selected DP ---
  const confirmOutForDelivery = async () => {
    if (!pendingOutForDeliveryOrder || !dpSelectedId) return;
    setUpdatingStatusId(pendingOutForDeliveryOrder.id);
    try {
      // optimistic update for UI
      const chosen = dpList.find((d) => d.id === dpSelectedId);
      setOrders((os) =>
        os.map((o) =>
          o.id === pendingOutForDeliveryOrder.id
            ? {
                ...o,
                order_status: "out_for_delivery",
                delivery_partner_id: dpSelectedId,
                delivery_partner_name: chosen?.fullName || o.delivery_partner_name || null,
                delivery_partner_phone: chosen?.phoneNumber || o.delivery_partner_phone || null,
              }
            : o
        )
      );
      await adminApi.updateOrderStatus(pendingOutForDeliveryOrder.id, "out_for_delivery", dpSelectedId);
      setSelected((sel) =>
        sel && sel.id === pendingOutForDeliveryOrder.id
          ? {
              ...sel,
              order_status: "out_for_delivery",
              delivery_partner_id: dpSelectedId,
              delivery_partner_name: chosen?.fullName || sel.delivery_partner_name,
              delivery_partner_phone: chosen?.phoneNumber || sel.delivery_partner_phone,
            }
          : sel
      );
      setAssignOpen(false);
      setPendingOutForDeliveryOrder(null);
      setDpSelectedId("");
    } catch (e) {
      // On failure, we let the optimistic change revert by reloading selected from orders or you can refetch
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Filters & KPIs */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* Search + Filter */}
          <div className="flex items-center gap-2 col-span-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, customer, restaurant, phone"
              aria-label="Search orders"
            />
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Statuses" : s.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-muted-foreground">Total Orders</div>
              <div className="text-lg font-semibold">{kpis.total}</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-muted-foreground">Revenue</div>
              <div className="text-lg font-semibold">{formatINR(kpis.revenue)}</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-muted-foreground">Delivered</div>
              <div className="text-lg font-semibold">{kpis.counts["delivered"] ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-0"><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Pickup Window</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelected(o)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelected(o);
                      }}
                      aria-label={`Open details for order ${o.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{o.id.substring(0, 8)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copy(o.id);
                            }}
                            aria-label="Copy order id"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User2 className="h-4 w-4" />
                          <div className="truncate">
                            <div className="font-medium truncate max-w-[180px]">{o.customer_name || "N/A"}</div>
                            <a
                              href={o.customer_phone ? `tel:${o.customer_phone}` : undefined}
                              className={cn("text-xs text-muted-foreground", !o.customer_phone && "pointer-events-none")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {o.customer_phone || "-"}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[220px]">{o.restaurant_name || "N/A"}</div>
                      </TableCell>
                      <TableCell>
                        {o.pickup_time_slot_start && o.pickup_time_slot_end ? (
                          <div className="text-sm">
                            {o.pickup_time_slot_start}–{o.pickup_time_slot_end}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {Number(o.total_payment_amount || 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(o.order_status)} className="capitalize">
                          {o.order_status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{timeAgo(o.created_at)}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{filtered.length} orders listed</TableCaption>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={!!selected} onOpenChange={(open: boolean) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full px-2 sm:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-[1200px] overflow-y-auto">
          {selected && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span>Order #{selected.id}</span>
                </SheetTitle>
              </SheetHeader>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selected.order_status}
                  onValueChange={(v) => handleStatusChange(selected, v as Order["order_status"])}
                >
                  <SelectTrigger className="w-[240px]"><SelectValue placeholder="Update status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {updatingStatusId === selected.id && (
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Updating…
                  </span>
                )}

                <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) { setPendingOutForDeliveryOrder(null); setDpSelectedId(""); } }}>
                  <DialogTrigger asChild>
                    {/* Hidden trigger; dialog opens programmatically when choosing out_for_delivery */}
                    <span />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set "Out for delivery"</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid gap-1">
                        <Label htmlFor="dp">Select delivery partner</Label>
                        <Select value={dpSelectedId} onValueChange={setDpSelectedId}>
                          <SelectTrigger id="dp"><SelectValue placeholder={dpLoading ? "Loading…" : "Choose partner"} /></SelectTrigger>
                          <SelectContent>
                            {dpError && <div className="px-2 py-1 text-destructive text-sm">{dpError}</div>}
                            {dpList.map((dp) => (
                              <SelectItem key={dp.id} value={dp.id}>
                                {dp.fullName}{dp.phoneNumber ? ` • ${dp.phoneNumber}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={confirmOutForDelivery} disabled={!dpSelectedId || updatingStatusId !== null} className="gap-2">
                        {updatingStatusId && <Loader2 className="h-4 w-4 animate-spin"/>}
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Overview */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Overview</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Order ID" value={selected.id} copyable />
                  <InfoRow label="Created" value={formatDateTime(selected.created_at)} />
                  <InfoRow label="Payment" value={selected.payment_status} icon={
                    selected.payment_status === "paid" ? <CheckCircle2 className="h-4 w-4"/> : selected.payment_status === "failed" ? <XCircle className="h-4 w-4"/> : <Clock className="h-4 w-4"/>} />
                  <InfoRow label="Txn ID" value={selected.payment_transaction_id || "-"} copyable />
                </CardContent>
              </Card>

              {/* Money */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Amounts</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <MoneyRow label="Bag" value={selected.total_bag_amount} />
                  <MoneyRow label="Delivery Fee" value={selected.delivery_fee} />
                  <MoneyRow label="Platform Commission" value={selected.platform_commission} />
                  <Separator className="col-span-2"/>
                  <MoneyRow label="Total Collected" value={selected.total_payment_amount} bold />
                </CardContent>
              </Card>

              {/* Parties */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">People & Places</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2"><User2 className="h-4 w-4"/>Customer</div>
                      <div className="text-sm">{selected.customer_name || "-"}</div>
                      <a className="text-xs text-muted-foreground inline-flex items-center gap-1" href={selected.customer_phone ? `tel:${selected.customer_phone}` : undefined} onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3 w-3"/>{selected.customer_phone || "-"}
                      </a>
                      <div className="text-xs text-muted-foreground">{selected.customer_email_snapshot || ""}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Restaurant</div>
                      <div className="text-sm">{selected.restaurant_name || "-"}</div>
                      <div className="text-xs text-muted-foreground">Contact: {selected.restaurant_contact_person || "-"}</div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4"/>Delivery Partner</div>
                      <div className="text-sm">{selected.delivery_partner_name || "Unassigned"}</div>
                      <a className={cn("text-xs text-muted-foreground inline-flex items-center gap-1", !selected.delivery_partner_phone && "pointer-events-none")}
                         href={selected.delivery_partner_phone ? `tel:${selected.delivery_partner_phone}` : undefined}
                         onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3 w-3"/>{selected.delivery_partner_phone || "-"}
                      </a>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4"/>Delivery Address</div>
                      <div className="text-sm leading-5 whitespace-pre-wrap">{selected.delivery_address_snapshot}</div>
                      <a className="text-xs text-muted-foreground inline-flex items-center gap-1" href={openMapsUrl(selected)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        Open in Maps <ExternalLink className="h-3 w-3"/>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timing */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Timing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <InfoRow label="Order Date" value={formatDateTime(selected.order_date)} />
                  <InfoRow label="Pickup Window" value={
                    selected.pickup_time_slot_start && selected.pickup_time_slot_end
                      ? `${selected.pickup_time_slot_start}–${selected.pickup_time_slot_end}`
                      : "-"
                  } />
                  <InfoRow label="Expected Delivery" value={formatDateTime(selected.expected_delivery_time)} />
                  <InfoRow label="Actual Delivery" value={formatDateTime(selected.actual_delivery_time)} />
                </CardContent>
              </Card>

              {/* Notes / Cancellation */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm whitespace-pre-wrap min-h-[20px]">
                    {selected.notes_to_restaurant || <span className="text-muted-foreground">No notes</span>}
                  </div>
                  {selected.cancellation_reason && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                      <div className="font-medium mb-1">Cancellation</div>
                      <div className="text-sm">{selected.cancellation_reason}</div>
                      <div className="text-xs text-muted-foreground mt-1">By: {selected.cancelled_by_user_type || "-"}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ------------------ Subcomponents ------------------
function InfoRow({ label, value, copyable, icon }: { label: string; value: string | number; copyable?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm max-w-[220px] truncate" title={String(value)}>{String(value)}</div>
        {copyable && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={async () => {
              try { await navigator.clipboard.writeText(String(value)); } catch {}
            }}
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MoneyRow({ label, value, bold }: { label: string; value: string | number; bold?: boolean }) {
  const v = typeof value === "string" ? Number(value) : value;
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("flex items-center gap-1 text-sm", bold && "font-semibold")}> <IndianRupee className="h-3 w-3"/>{v.toFixed(2)}</div>
    </div>
  );
}
