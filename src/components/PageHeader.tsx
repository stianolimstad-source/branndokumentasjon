import { Button } from "@/components/ui/button";
import { Flame, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
}

const PageHeader = ({ title, subtitle, icon, rightContent }: PageHeaderProps) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                {icon || <Flame className="h-6 w-6 text-primary-foreground" />}
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Hjem
              </Button>
            </Link>
            {rightContent}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
