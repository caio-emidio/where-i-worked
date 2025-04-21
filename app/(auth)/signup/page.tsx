"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const { toast } = useToast()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error, success } = await signUp(email, password)

      if (error) {
        toast({
          title: "Error creating account",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (success) {
        setSignupSuccess(true)
        toast({
          title: "Account created successfully",
          description: "Please check your email to confirm your account.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (signupSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-black">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>We've sent a confirmation link to {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the confirmation link to activate your account.
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
    <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-md" />
      
      <div className="absolute top-4 right-4 z-[100] text-white cursor-pointer">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-xl bg-black/10 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-purple-100">Where I Worked</h1>
          <p className="text-sm text-muted-foreground">Create an account to track your work days</p>
        </div>

        <Card className="bg-transparent shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-white">Create account</CardTitle>
            <CardDescription>Fill in the fields below to get started</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              <div className="text-center text-sm text-white">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
