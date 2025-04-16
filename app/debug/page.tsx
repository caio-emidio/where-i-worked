// app/debug/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DebugServerComponent from "./DebugServerComponent"; // Importa o Server Component

export default function DebugPage() {
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    // Sign out logic (caso necessário)
  };

  const handleGoToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const handleGoToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="container py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Check your current authentication status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p>Loading session information...</p>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-medium">Session Status</h3>
                <DebugServerComponent />
              </div>

              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-medium">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
                  <Button onClick={handleGoToLogin} variant="outline">Go to Login</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
