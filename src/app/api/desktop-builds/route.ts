// Updated list route – returns installers stored in the database via Prisma
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request?: Request) {
  try {
    const session = await auth.api.getSession({ headers: request?.headers ?? {} });
    void session;

    const installers = await prisma.desktopInstaller.findMany({
      orderBy: { createdAt: "desc" },
    });

    const builds = installers.map((i) => ({
      id: i.id,
      version: i.version,
      os: i.os,
      arch: "x86_64",
      format: i.fileType,
      filename: i.fileUrl.split("/").pop() ?? i.fileUrl,
      size: i.fileSize,
      downloadUrl: i.fileUrl,
      checksum: undefined,
      publishedAt: i.createdAt?.toISOString(),
    }));

    return NextResponse.json({ builds });
  } catch (error) {
    console.error("desktop-builds list error:", error);
    return NextResponse.json({ builds: [] }, { status: 500 });
  }
}

