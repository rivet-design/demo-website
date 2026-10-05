export type ClipboardWriteResult =
  | { ok: true }
  | { ok: false; errorName: string };

export const writeClipboard = async (
  text: string,
): Promise<ClipboardWriteResult> => {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      errorName: error instanceof Error ? error.name : 'Unknown',
    };
  }
};
