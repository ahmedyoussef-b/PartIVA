import { describe, it, expect } from 'vitest';
import { recommendMachine } from './machine-recommendation';
import type { Machine } from '@/generated/prisma/client';

const mockMachines: Machine[] = [
  { id: '1', code: 'CNC-01', name: 'Fraiseuse 1', type: 'CNC', status: 'IDLE', location: 'Atelier A', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', code: 'CNC-02', name: 'Fraiseuse 2', type: 'CNC', status: 'MAINTENANCE', location: 'Atelier A', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', code: 'LATHE-01', name: 'Tour 1', type: 'LATHE', status: 'IDLE', location: 'Atelier B', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', code: 'PRINTER-01', name: 'Imprimante 1', type: 'PRINTER_3D', status: 'IDLE', location: 'Atelier C', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', code: 'OFFLINE-01', name: 'Hors ligne', type: 'CNC', status: 'OFFLINE', location: 'Atelier Z', createdAt: new Date(), updatedAt: new Date() },
];

describe('recommendMachine', () => {
  it('recommande une CNC pour une pièce en plastique standard', () => {
    const result = recommendMachine({
      part: { material: 'POM-C', autoCategory: 'pièce standard' },
      machines: mockMachines,
    });
    expect(result.machine?.type).toBe('CNC');
    expect(result.score).not.toBe('faible');
  });

  it('recommande une imprimante 3D pour une pièce en plastique prototype', () => {
    const result = recommendMachine({
      part: { material: 'PEEK', autoCategory: 'prototype rapide' },
      machines: mockMachines,
    });
    expect(result.machine?.type).toBe('PRINTER_3D');
  });

  it('recommande un tour pour une pièce métallique avec diamètre', () => {
    const result = recommendMachine({
      part: { material: 'ACIER', specifications: [{ key: 'diameter', value: '25' }] },
      machines: mockMachines,
    });
    expect(result.machine?.type).toBe('LATHE');
  });

  it('recommande une CNC pour une pièce métallique sans diamètre', () => {
    const result = recommendMachine({
      part: { material: 'ALUMINIUM', specifications: [] },
      machines: mockMachines,
    });
    expect(result.machine?.type).toBe('CNC');
  });

  it('retourne alreadyAssigned si la pièce a déjà une machine', () => {
    const result = recommendMachine({
      part: { material: 'POM', machineId: '1' },
      machines: mockMachines,
    });
    expect(result.alreadyAssigned).toBe(true);
    expect(result.machine?.id).toBe('1');
  });

  it('retourne null si les données sont insuffisantes', () => {
    const result = recommendMachine({
      part: { material: null, specifications: [] },
      machines: mockMachines,
    });
    expect(result.machine).toBeNull();
    expect(result.score).toBe('faible');
  });

  it('retourne null si toutes les machines sont en MAINTENANCE ou OFFLINE', () => {
    const maintenanceMachines = mockMachines.filter(m => m.status === 'MAINTENANCE' || m.status === 'OFFLINE');
    const result = recommendMachine({
      part: { material: 'POM-C' },
      machines: maintenanceMachines,
    });
    expect(result.machine).toBeNull();
  });
});