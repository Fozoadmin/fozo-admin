import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Search, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-16 flex items-center justify-between border-b px-4 lg:px-6 bg-background/60 backdrop-blur">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <LayoutDashboard className="h-6 w-6" />
        Admin
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

