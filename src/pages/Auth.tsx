import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: 'Ugyldig e-post',
        description: 'Vennligst skriv inn en gyldig e-postadresse.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: 'Ugyldig passord',
        description: 'Passordet må være minst 6 tegn.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      let message = 'Noe gikk galt. Prøv igjen.';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Feil e-post eller passord.';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'E-posten din er ikke bekreftet ennå.';
      }
      toast({
        title: 'Innlogging feilet',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: 'Ugyldig e-post',
        description: 'Vennligst skriv inn en gyldig e-postadresse.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: 'Ugyldig passord',
        description: 'Passordet må være minst 6 tegn.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passordene stemmer ikke',
        description: 'Vennligst sjekk at begge passordene er like.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      let message = 'Noe gikk galt. Prøv igjen.';
      if (error.message.includes('User already registered')) {
        message = 'Denne e-postadressen er allerede registrert.';
      }
      toast({
        title: 'Registrering feilet',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Konto opprettet!',
        description: 'Vi har sendt deg en bekreftelsesmail. Sjekk innboksen din (og spam-mappen) og klikk på lenken for å bekrefte kontoen din.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Velkommen</CardTitle>
          <CardDescription>
            Logg inn eller opprett en konto for å fortsette
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logg inn</TabsTrigger>
              <TabsTrigger value="register">Registrer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-post</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passord</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logger inn...
                    </>
                  ) : (
                    'Logg inn'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Fullt navn</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Ola Nordmann"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-post</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Passord</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Bekreft passord</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Oppretter konto...
                    </>
                  ) : (
                    'Opprett konto'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
