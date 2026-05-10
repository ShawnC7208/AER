import { createTwoFilesPatch } from "diff";

export interface UnifiedDiffResult {
  diff: string;
  stats: { added: number; removed: number };
}

export function unifiedDiff(before: string, after: string): UnifiedDiffResult {
  const diff = createTwoFilesPatch("before", "after", before, after, "", "", {
    context: 3,
  });
  const stats = diff.split("\n").reduce(
    (acc, line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) acc.added += 1;
      if (line.startsWith("-") && !line.startsWith("---")) acc.removed += 1;
      return acc;
    },
    { added: 0, removed: 0 },
  );

  return { diff, stats };
}
