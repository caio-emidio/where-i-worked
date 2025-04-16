"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session:", error)
        }
        setSessionInfo(data)
      } catch (e) {
        console.error("Exception checking session:", e)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleGoToDashboard = () => {
    window.location.href = "/dashboard"
  }

  const handleGoToLogin = () => {
    window.location.href = "/login"
  }

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
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto">{JSON.stringify(sessionInfo, null, 2)}</pre>
              </div>

              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-medium">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGoToDashboard}>Go to Dashboard</Button>
                  <Button onClick={handleGoToLogin} variant="outline">
                    Go to Login
                  </Button>
                  {sessionInfo?.session && (
                    <Button onClick={handleSignOut} variant="destructive">
                      Sign Out
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Browser Information</h3>
                <p className="text-sm text-muted-foreground mt-1">User Agent: {navigator.userAgent}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
