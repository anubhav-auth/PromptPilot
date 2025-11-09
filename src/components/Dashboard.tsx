import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User as UserIcon } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <Card className="w-full max-w-sm shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          Extension Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
          <UserIcon className="w-6 h-6 text-muted-foreground" />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground">
              Logged in as:
            </p>
            <p className="text-sm text-primary font-semibold break-all">
              {user?.email}
            </p>
          </div>
        </div>
        <Button onClick={signOut} className="w-full" variant="destructive">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </CardContent>
    </Card>
  );
};

export default Dashboard;