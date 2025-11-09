import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showError } from "@/utils/toast";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Github } from "lucide-react";

type OAuthProvider = "google" | "github";

const AuthForm: React.FC = () => {
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });

    if (error) {
      showError(`Error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-none border-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          Welcome
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleOAuthLogin("google")}
          >
            <GoogleIcon className="mr-2 h-5 w-5" fill="currentColor" />
            Sign in with Google
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleOAuthLogin("github")}
          >
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthForm;