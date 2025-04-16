"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { toast } = useToast()
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error, success } = await resetPassword(email)

      if (error) {
        toast({
          title: "Error sending recovery email",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (success) {
        setResetSent(true)
        toast({
          title: "Email sent",
          description: "Check your inbox for the password reset link.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email sent</CardTitle>
            <CardDescription>We've sent a recovery link to {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the link to reset your password.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">Return to login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Clock className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Where I Worked</h1>
          <p className="text-sm text-muted-foreground">Recover access to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>Enter your email to receive a recovery link</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send recovery link"}
              </Button>
              <div className="text-center text-sm">
                Remembered your password?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Return to login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
