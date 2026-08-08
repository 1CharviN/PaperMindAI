import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2 } from "lucide-react";
import { signUpWithEmail, loginWithEmail, loginWithGoogle } from "@/lib/firebaseAuth";
import { SiGoogle } from "react-icons/si";

export default function LoginSignup() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: t("error"),
            description: t("passwordsDoNotMatch"),
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          toast({
            title: t("error"),
            description: t("passwordMustBeAtLeast6Characters"),
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password);
        toast({
          title: t("success"),
          description: t("accountCreatedRedirecting"),
        });
      } else {
        await loginWithEmail(email, password);
        toast({
          title: t("success"),
          description: t("loggedInRedirecting"),
        });
      }
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      const errorMessage = error.message || "Authentication failed";
      
      // Check if it's a Firebase configuration error
      if (errorMessage.includes("not configured") || errorMessage.includes("invalid-api-key")) {
        toast({
          title: t("setupRequired"),
          description: t("configureFirebaseCredentials"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      toast({
        title: t("success"),
        description: t("loggedInWithGoogleRedirecting"),
      });
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("googleLoginFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">PaperMind AI</h1>
          </div>
          <div className="text-center">
            <CardTitle>{isSignUp ? t("createAccount") : t("welcomeBack")}</CardTitle>
            <CardDescription>
              {isSignUp
                ? t("signUpToStartAnalyzingResearchPapers")
                : t("signInToYourAccount")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t("enterYourPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                data-testid="input-password"
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  {t("confirmPassword")}
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t("confirmYourPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? t("creatingAccount") : t("signingIn")}
                </>
              ) : isSignUp ? (
                t("createAccount")
              ) : (
                t("signIn")
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            data-testid="button-google-login"
          >
            <SiGoogle className="h-4 w-4" />
            {t("google")}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? t("alreadyHaveAnAccount") : t("dontHaveAnAccount")}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-primary hover:underline font-medium"
              data-testid="button-toggle-auth-mode"
            >
              {isSignUp ? t("signIn") : t("signUp")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
