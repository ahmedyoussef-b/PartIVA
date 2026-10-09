'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Machine } from '@/generated/prisma/client';

type MachineWithRelations = Machine;

const MachineStatusSchema = z.enum(['IDLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE']);

const MachineTypeSchema = z.enum(['CNC', 'LATHE', 'PRINTER_3D']);

const CreateMachineSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  name: z.string().min(1, 'Le nom est requis'),
  type: MachineTypeSchema,
  status: MachineStatusSchema.default('IDLE'),
  location: z.string().optional(),
});

const UpdateMachineSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: MachineTypeSchema.optional(),
  status: MachineStatusSchema.optional(),
  location: z.string().optional(),
});

export async function createMachine(
  input: z.infer<typeof CreateMachineSchema>,
): Promise<{ success: true; data: MachineWithRelations } | { success: false; error: string }> {
  try {
    const validated = CreateMachineSchema.parse(input);

    const machine = await prisma.machine.create({
      data: {
        code: validated.code,
        name: validated.name,
        type: validated.type,
        status: validated.status,
        location: validated.location,
      },
    });

    revalidatePath('/admin/machines');
    revalidatePath('/admin/dashboard');

    return { success: true, data: machine };
  } catch (error) {
    console.error('Error creating machine:', error);
    return { success: false, error: 'Erreur lors de la création de la machine' };
  }
}

export async function updateMachine(
  input: z.infer<typeof UpdateMachineSchema>,
): Promise<{ success: true; data: MachineWithRelations } | { success: false; error: string }> {
  try {
    const validated = UpdateMachineSchema.parse(input);

    const { id, ...data } = validated;

    const machine = await prisma.machine.update({
      where: { id },
      data,
    });

    revalidatePath('/admin/machines');
    revalidatePath('/admin/dashboard');

    return { success: true, data: machine };
  } catch (error) {
    console.error('Error updating machine:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de la machine' };
  }
}
