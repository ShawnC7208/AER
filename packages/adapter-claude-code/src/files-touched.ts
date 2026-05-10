import type { FileTouched, Mutation } from "@aer/core";

export function rollupFilesTouched(mutations: Mutation[]): FileTouched[] {
  const byPath = new Map<string, Mutation[]>();
  for (const mutation of mutations) {
    byPath.set(mutation.target, [...(byPath.get(mutation.target) ?? []), mutation]);
  }

  return [...byPath.entries()].map(([path, pathMutations]) => {
    const last = pathMutations.at(-1);
    const linesAdded = pathMutations.reduce(
      (sum, mutation) => sum + (mutation.diffStats?.added ?? 0),
      0,
    );
    const linesRemoved = pathMutations.reduce(
      (sum, mutation) => sum + (mutation.diffStats?.removed ?? 0),
      0,
    );
    const first = pathMutations[0];

    const file: FileTouched = {
      path,
      status: first?.kind === "write" && first.beforeHash === undefined ? "new" : "modified",
      linesAdded,
      linesRemoved,
      mutationIds: pathMutations.map((mutation) => mutation.id),
    };
    if (last?.afterHash) file.finalHash = last.afterHash;
    if (last?.afterBytes !== undefined) file.finalBytes = last.afterBytes;
    return file;
  });
}
