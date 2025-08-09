import type React from "react"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export default function AuthLayout( {
  children,
}: {
  children: React.ReactNode
} ) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
