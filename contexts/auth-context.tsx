"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { createClientSupabaseClient } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    success: boolean
  }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    success: boolean
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    success: boolean
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true)

      try {
        console.log("Checking for existing session...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          throw error
        }

        if (session) {
          console.log("Found existing session, user is logged in:", session.user.email)
          setSession(session)
          setUser(session.user)
        } else {
          console.log("No existing session found")
        }
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with email:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      console.log("Sign in successful:", data.user?.email)
      console.log("Session:", data.session)

      // Let the middleware handle the redirect
      return { error: null, success: true }
    } catch (error) {
      console.error("Error signing in:", error)
      return { error: error as Error, success: false }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign up with email:", email)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error("Sign up error:", error)
        throw error
      }

      console.log("Sign up successful")
      return { error: null, success: true }
    } catch (error) {
      console.error("Error signing up:", error)
      return { error: error as Error, success: false }
    }
  }

  const signOut = async () => {
    console.log("Signing out...")
    await supabase.auth.signOut()
    console.log("Signed out")
    // Let the middleware handle the redirect
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("Attempting to reset password for email:", email)
      // Get the current URL from the environment or use a fallback
      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : window.location.origin

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/reset-password`,
      })

      if (error) {
        console.error("Reset password error:", error)
        throw error
      }

      console.log("Reset password email sent")
      return { error: null, success: true }
    } catch (error) {
      console.error("Error resetting password:", error)
      return { error: error as Error, success: false }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
