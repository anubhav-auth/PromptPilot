import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showLoading, dismissToast, showError, showSuccess } from "@/utils/toast";

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = showLoading(isLogin ? "Logging in..." : "Signing up...");

    try {
      let error = null;
      
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        error = loginError;
      } else {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });
        error = signupError;
      }

      if (error) {
        showError(error.message);
      } else {
        showSuccess(isLogin ? "Logged in successfully!" : "Check your email for the confirmation link!");
      }
    } catch (err) {
      showError("An unexpected error occurred.");
    } finally {
      dismissToast(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          {isLogin ? "Welcome Back" : "Create Account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="p-0 h-auto"
            disabled={isSubmitting}
          >
            {isLogin ? "Sign Up" : "Login"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthForm;