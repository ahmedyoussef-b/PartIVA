import { prisma } from '@/lib/prisma';

const [type, status] = process.argv.slice(2);
const machineType = type || 'CNC';
const machineStatus = status || 'IDLE';

const machine = await prisma.machine.create({
  data: {
    code: `E2E-${Date.now()}`,
    name: `E2E-MACHINE-${Date.now()}`,
    type: machineType as any,
    status: machineStatus as any,
  },
});

console.log(JSON.stringify({ id: machine.id, name: machine.name, type: machine.type }));
await prisma.$disconnect();
