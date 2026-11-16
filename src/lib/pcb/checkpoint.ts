import { prisma } from '@/lib/prisma';

export async function createCheckpoint(projectId: string, label: string) {
  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
      components: { include: { pins: true } },
      nets: true,
    },
  });

  if (!project) {
    throw new Error(`Projet ${projectId} introuvable`);
  }

  const snapshot = {
    requirements: project.requirements,
    components: project.components,
    nets: project.nets,
    createdAt: new Date().toISOString(),
  };

  return prisma.pcbCheckpoint.create({
    data: {
      projectId,
      label,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
    },
  });
}

export async function rollbackToCheckpoint(checkpointId: string) {
  const checkpoint = await prisma.pcbCheckpoint.findUnique({
    where: { id: checkpointId },
  });

  if (!checkpoint) {
    throw new Error(`Checkpoint ${checkpointId} introuvable`);
  }

  const snapshot = checkpoint.snapshot as {
    requirements: unknown[];
    components: unknown[];
    nets: unknown[];
  };

  await prisma.$transaction(async (tx) => {
    await tx.pcbRequirement.deleteMany({ where: { projectId: checkpoint.projectId } });
    await tx.pcbComponent.deleteMany({ where: { projectId: checkpoint.projectId } });
    await tx.pcbNet.deleteMany({ where: { projectId: checkpoint.projectId } });

    for (const r of snapshot.requirements) {
      await tx.pcbRequirement.create({
        data: { ...(r as object), projectId: checkpoint.projectId } as never,
      });
    }
    for (const c of snapshot.components) {
      await tx.pcbComponent.create({
        data: { ...(c as object), projectId: checkpoint.projectId } as never,
      });
    }
    for (const n of snapshot.nets) {
      await tx.pcbNet.create({
        data: { ...(n as object), projectId: checkpoint.projectId } as never,
      });
    }
  });

  return checkpoint;
}
