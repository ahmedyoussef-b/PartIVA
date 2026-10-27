export function isTauriEnv(): boolean {
  return false;
}

export async function askRagStream(
  _question: string,
  _conversationId: string,
  _handlers: {
    onToken?: (token: string) => void;
    onDone?: (sources: unknown, images: { path: string; metadataPath?: string }[] | undefined, fullAnswer: string) => void;
    onError?: (msg: string) => void;
  },
  _pathFilter?: string | null,
): Promise<() => void> {
  return () => {};
}
