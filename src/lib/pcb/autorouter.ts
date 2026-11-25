// Le DSN Specctra n'est plus généré à la main : KiCad 10 le produit
// directement depuis le plateau via pcbnew.ExportSpecctraDSN (outline,
// couches, netclasses, padstacks réels). Voir scripts/kicad/specctra.py.

export { exportDsn, importSes } from '@/lib/pcb/kicad-bridge';
