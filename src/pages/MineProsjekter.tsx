import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Plus, FolderOpen, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MineProsjekter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">BrannRådgiver Pro</h1>
              </Link>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Mine prosjekter</h2>
              <p className="text-muted-foreground mt-1">
                Administrer og organiser dine branntekniske prosjekter
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nytt prosjekt
            </Button>
          </div>

          {/* Empty State */}
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">Ingen prosjekter ennå</CardTitle>
              <CardDescription className="text-center max-w-sm mb-6">
                Opprett ditt første prosjekt for å komme i gang med brannteknisk dokumentasjon.
              </CardDescription>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Opprett prosjekt
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MineProsjekter;
