"use client"

import type React from "react"

import { useEffect } from "react"
import { Clock, LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export default function DashboardLayout( {
  children,
}: {
  children: React.ReactNode
} ) {
  const { user, isLoading, signOut } = useAuth()

  useEffect( () => {
    console.log( "Dashboard layout - Auth state:", {
      user: user?.email,
      isLoading,
    } )
  }, [isLoading, user] )

  if ( isLoading ) {
    console.log( "Dashboard layout - Still loading auth state" )
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">Where I Worked</span>
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-1">
          <div className="container py-6">
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  // Let middleware handle redirects if not authenticated
  // Don't add additional redirects here

  console.log( "Dashboard layout - Rendering dashboard for user:", user?.email )
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/android-chrome-192x192.png" alt="Logo" className="size-8 rounded-md" />
            <span className="font-semibold text-lg">Where I Worked</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    signOut().then( () => {
                      window.location.href = "/login"
                    } )
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 max-w-md md:max-w-full mx-auto">{children}</div>
      </main>
    </div>
  )
}
