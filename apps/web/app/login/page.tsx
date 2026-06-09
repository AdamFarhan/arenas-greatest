"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { hasSupabaseConfig, getBrowserSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function signIn() {
    if (!hasSupabaseConfig()) {
      setMessage("Add Supabase environment variables before signing in.");
      return;
    }

    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    setMessage(error ? error.message : "Check your email for a magic link.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>The Arena's Greatest</CardTitle>
          <CardDescription>Sign in to review match data collected from your phone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button className="w-full" onClick={signIn} disabled={!email}>
            <Mail size={16} />
            Send magic link
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
