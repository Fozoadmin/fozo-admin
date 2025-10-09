import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  suffix?: string;
  delta?: number;
  className?: string;
};

export function StatCard({ icon: Icon, title, value, suffix = "", delta, className = "" }: StatCardProps) {
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

