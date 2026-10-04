'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Database,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  RefreshCw,
  Info,
  CheckCircle2,
} from 'lucide-react'

const SETTINGS_SECTIONS = [
  { id: 'atelier', label: 'Atelier', icon: Settings },
  { id: 'sync',    label: 'Synchronisation', icon: RefreshCw },
  { id: 'notifs',  label: 'Notifications', icon: Bell },
  { id: 'securite',label: 'Sécurité', icon: Shield },
  { id: 'ui',      label: 'Interface', icon: Palette },
]

export default function AdminParametresPage() {
  const [activeSection, setActiveSection] = React.useState('atelier')
  const [saved, setSaved] = React.useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configuration de la plateforme admin — connexion cloud, notifications et préférences atelier.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="w-full sm:w-48 shrink-0">
          <nav className="space-y-1">
            {SETTINGS_SECTIONS.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {s.label}
                </button>
              )
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom de l'atelier</Label>
                    <Input defaultValue="Atelier Plastiques Sfax" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Référence interne</Label>
                    <Input defaultValue="ATL-SFX-001" className="text-xs font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Responsable technique</Label>
                    <Input defaultValue="Ingénieur Méthodes" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fuseau horaire</Label>
                    <Input defaultValue="Africa/Tunis (UTC+1)" className="text-xs" readOnly />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Adresse physique</Label>
                    <Input defaultValue="Zone Industrielle, Sfax 3000, Tunisie" className="text-xs" />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Ces informations apparaissent dans les devis PDF et les notifications envoyées aux clients.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'sync' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Configuration Synchronisation Neon</CardTitle>
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
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Intervalle de sync (secondes)</Label>
                      <Input type="number" defaultValue={45} className="text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rétention locale (jours)</Label>
                      <Input type="number" defaultValue={90} className="text-xs font-mono" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Connexion testée et opérationnelle</span>
                  <Badge variant="outline" className="ml-auto text-[9px] font-mono border-emerald-500/30 text-emerald-500">
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
                  { label: 'Nouvelle demande urgence CRITIQUE', desc: 'Alerte immédiate dès la réception', active: true },
                  { label: 'Candidat trouvé ≥ 70% similarité', desc: 'Notification pour validation rapide', active: true },
                  { label: 'Retard de synchronisation > 5 min', desc: 'Alerte perte de connexion cloud', active: true },
                  { label: 'Machine CNC en surcharge (> 90%)', desc: 'Monitoring charge parc machines', active: false },
                  { label: 'Rapport de production quotidien', desc: 'Résumé 18h00 chaque jour', active: false },
                ].map((notif) => (
                  <div key={notif.label} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20">
                    <div>
                      <p className="text-xs font-medium">{notif.label}</p>
                      <p className="text-[10px] text-muted-foreground">{notif.desc}</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors cursor-pointer border ${
                      notif.active ? 'bg-primary border-primary/50' : 'bg-muted border-border'
                    }`} />
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
                  Accès et authentification à l'interface admin de l'atelier
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
                  <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-muted/40 border">
                    <div>
                      <p className="font-medium">Poste Atelier Local</p>
                      <p className="text-muted-foreground text-[10px]">192.168.1.10 — Connecté depuis 2h</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">Active</Badge>
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
                  Préférences d'affichage et de langue
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
                    <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <span className="text-xs font-medium">{pref.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{pref.value}</Badge>
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
                  <CheckCircle2 className="w-4 h-4" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
