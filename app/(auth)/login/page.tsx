"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme/theme-toggle"; // ajuste o caminho se necessário
import { Github } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState( "" );
  const [password, setPassword] = useState( "" );
  const [isLoading, setIsLoading] = useState( false );
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSubmit = async ( e: React.FormEvent ) => {
    e.preventDefault();
    setIsLoading( true );

    try {
      const { error, success } = await signIn( email, password );

      if ( error ) {
        toast( {
          title: "Login error",
          description: error.message,
          variant: "destructive",
        } );
        return;
      }

      if ( success ) {
        toast( {
          title: "Login successful",
          description: "Welcome back!",
        } );
        window.location.href = "/dashboard";
      }
    } finally {
      setIsLoading( false );
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-md md:backdrop-blur-none" />
      {/* Theme toggle button */}
      <div className="absolute top-4 right-4 z-[100] text-white cursor-pointer">
        <ThemeToggle />
        <a
          href="https://github.com/caio-emidio/where-i-worked"
          target="_blank"
          className="inline-flex items-center justify-center"
        >
          <Github className="w-5 h-5 text-white hover:text-gray-300 transition cursor-pointer" />
        </a>
      </div>

      {/* Overlay for blur and form */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-black/10 p-8 shadow-xl md:backdrop-blur-md backdrop-blur-none">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-purple-100">Where I Worked</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to track your work days
          </p>
        </div>

        <Card className="bg-transparent shadow-none border-none">
          <CardHeader>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ben@adams.com"
                  value={email}
                  onChange={( e ) => setEmail( e.target.value )}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={( e ) => setPassword( e.target.value )}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-center text-sm text-white">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
