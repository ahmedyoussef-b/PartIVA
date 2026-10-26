import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction, ArrowRight } from 'lucide-react';

/**
 * Page placeholder « En cours de développement » (E5-S02).
 *
 * Affichée quand NEXT_PUBLIC_PLACEHOLDER_MODE=true et qu'une
 * route fonctionnelle (recherche, admin, client) est demandée.
 * La vitrine publique (/, /services, /contact, ...) reste
 * accessible — seul le périmètre fonctionnel est masqué.
 */
export default function PlaceholderPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="container">
        <Card className="border-border/60 mx-auto max-w-md">
          <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
            <div className="bg-primary/10 text-primary rounded-full p-4">
              <Construction className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="outline">Espace client</Badge>
              <CardTitle className="text-2xl font-bold tracking-tight">
                En cours de développement
              </CardTitle>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cette fonctionnalité sera bientôt disponible. Notre équipe finalise l&apos;espace de
                gestion des pièces industrielles.
              </p>
            </div>

            <Link href="/" className="w-full">
              <Button className="w-full gap-2">
                Retour à l&apos;accueil
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


