import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export function Settings() {
  const { user, token } = useAuth();
  
  return (
    <div className="h-full w-full flex flex-col">
      <div className="grid gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle>Admin Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <div className="text-sm mt-1">{user?.full_name || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="text-sm mt-1">{user?.email || '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <div className="text-sm mt-1">{user?.phone_number || '—'}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User Type</label>
                    <div className="text-sm mt-1">
                      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                        {user?.user_type || '—'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                    <div className="text-sm mt-1">
                      <Badge variant={user?.is_active ? "default" : "destructive"}>
                        {user?.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Verification Status</label>
                    <div className="text-sm mt-1">
                      <Badge variant={user?.is_verified ? "default" : "secondary"}>
                        {user?.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <div className="text-sm mt-1">
                    {user?.created_at ? new Date(user.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Auth Token (Preview)</label>
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    <code className="text-xs font-mono break-all">
                      {token ? token.slice(0, 32) + '...' : 'No token found'}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

