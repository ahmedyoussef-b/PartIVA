'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Votre message a été transmis à nos ingénieurs atelier.');
    }, 1000);
  };

  return (
    <div className="container space-y-12 py-12">
      <div className="max-w-3xl space-y-3">
        <Badge variant="outline">Atelier & Métrologie</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">Contact & Nos Ateliers</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Une urgence d’arrêt de ligne ou un projet d’usinage de série ? Contactez directement nos
          ingénieurs méthodes et régleurs CNC.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Contact Form */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom & Prénom</Label>
                    <Input id="name" required placeholder="Ing. Tarek Mejri" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise / Usine</Label>
                    <Input id="company" required placeholder="Société Industrielle..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input id="email" type="email" required placeholder="tarek@usine.tn" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" type="tel" required placeholder="+216 98 000 000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Votre besoin ou description de la pièce</Label>
                  <Textarea
                    id="message"
                    required
                    placeholder="Précisez la matière souhaitée (POM-C, Téflon, etc.), la machine d'origine et la quantité..."
                    className="min-h-[120px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 font-bold shadow-md"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info & Addresses */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Atelier Principal (Usinage & CAO)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Zone Industrielle Poudrière II, Route de Gabès km 3, Sfax, Tunisie</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span>+216 74 123 456 / +216 98 765 432</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <span>sfax@atelier-pieces.tn</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span>Lun - Sam : 07h30 - 18h00 (Astreinte week-end)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Bureau Commercial & Dépôt Tunis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Parc Technologique El Ghazela, Raoued, Ariana / Tunis</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span>+216 71 890 123</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
