'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Shield, Palette, Save, RefreshCw, Info, CheckCircle2 } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { id: 'atelier', label: 'Atelier', icon: Settings },
  { id: 'sync', label: 'Synchronisation', icon: RefreshCw },
  { id: 'notifs', label: 'Notifications', icon: Bell },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'ui', label: 'Interface', icon: Palette },
];

export default function AdminParametresPage() {
  const [activeSection, setActiveSection] = React.useState('atelier');
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Paramètres</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Configuration de la plateforme admin — connexion cloud, notifications et préférences
          atelier.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Sidebar nav */}
        <div className="w-full shrink-0 sm:w-48">
          <nav className="space-y-1">
            {SETTINGS_SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary/20 bg-primary/10 text-primary border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeSection === 'atelier' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Informations Atelier</CardTitle>
                <CardDescription className="text-xs">
                  Identité et configuration de votre site de production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom de l&apos;atelier</Label>
                    <Input defaultValue="Atelier Plastiques Sfax" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Référence interne</Label>
                    <Input defaultValue="ATL-SFX-001" className="font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Responsable technique</Label>
                    <Input defaultValue="Ingénieur Méthodes" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fuseau horaire</Label>
                    <Input defaultValue="Africa/Tunis (UTC+1)" className="text-xs" readOnly />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Adresse physique</Label>
                    <Input
                      defaultValue="Zone Industrielle, Sfax 3000, Tunisie"
                      className="text-xs"
                    />
                  </div>
                </div>
                <Separator />
                <div className="bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
                  <Info className="text-primary h-4 w-4 shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    Ces informations apparaissent dans les devis PDF et les notifications envoyées
                    aux clients.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'sync' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  Configuration Synchronisation Neon
                </CardTitle>
                <CardDescription className="text-xs">
                  Paramètres de connexion à la base de données cloud Neon Postgres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">URL de connexion Neon</Label>
                    <Input
                      type="password"
                      defaultValue="postgresql://neon.tech/partiva-prod?sslmode=require"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Intervalle de sync (secondes)</Label>
                      <Input type="number" defaultValue={45} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rétention locale (jours)</Label>
                      <Input type="number" defaultValue={90} className="font-mono text-xs" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">
                    Connexion testée et opérationnelle
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto border-emerald-500/30 font-mono text-[9px] text-emerald-500"
                  >
                    Latence 42 ms
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifs' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Notifications</CardTitle>
                <CardDescription className="text-xs">
                  Alertes automatiques pour les événements critiques du flux de fabrication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: 'Nouvelle demande urgence CRITIQUE',
                    desc: 'Alerte immédiate dès la réception',
                    active: true,
                  },
                  {
                    label: 'Candidat trouvé ≥ 70% similarité',
                    desc: 'Notification pour validation rapide',
                    active: true,
                  },
                  {
                    label: 'Retard de synchronisation > 5 min',
                    desc: 'Alerte perte de connexion cloud',
                    active: true,
                  },
                  {
                    label: 'Machine CNC en surcharge (> 90%)',
                    desc: 'Monitoring charge parc machines',
                    active: false,
                  },
                  {
                    label: 'Rapport de production quotidien',
                    desc: 'Résumé 18h00 chaque jour',
                    active: false,
                  },
                ].map((notif) => (
                  <div
                    key={notif.label}
                    className="bg-muted/20 flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-xs font-medium">{notif.label}</p>
                      <p className="text-muted-foreground text-[10px]">{notif.desc}</p>
                    </div>
                    <div
                      className={`h-5 w-9 cursor-pointer rounded-full border transition-colors ${
                        notif.active ? 'border-primary/50 bg-primary' : 'border-border bg-muted'
                      }`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'securite' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Sécurité</CardTitle>
                <CardDescription className="text-xs">
                  Accès et authentification à l&apos;interface admin de l&apos;atelier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mot de passe actuel</Label>
                    <Input type="password" placeholder="••••••••" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nouveau mot de passe</Label>
                    <Input type="password" placeholder="••••••••" className="text-xs" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Session active</p>
                  <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3 text-xs">
                    <div>
                      <p className="font-medium">Poste Atelier Local</p>
                      <p className="text-muted-foreground text-[10px]">
                        192.168.1.10 — Connecté depuis 2h
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-[9px] text-emerald-500"
                    >
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'ui' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Interface</CardTitle>
                <CardDescription className="text-xs">
                  Préférences d&apos;affichage et de langue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: 'Langue', value: 'Français (Tunisie)' },
                    { label: 'Thème', value: 'Sombre (Dark)' },
                    { label: 'Format date', value: 'DD/MM/YYYY HH:mm' },
                    { label: 'Unités dimensionnelles', value: 'Millimètres (mm)' },
                    { label: 'Densité affichage', value: 'Compact' },
                  ].map((pref) => (
                    <div
                      key={pref.label}
                      className="bg-muted/20 flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-xs font-medium">{pref.label}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {pref.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2 font-bold" disabled={saved}>
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
