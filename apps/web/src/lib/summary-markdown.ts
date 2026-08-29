export interface InlineSegment {
  text: string;
  bold: boolean;
}

export type SummaryBlock =
  | { kind: "heading"; segments: InlineSegment[] }
  | { kind: "bullet"; segments: InlineSegment[] }
  | { kind: "numbered"; marker: string; segments: InlineSegment[] }
  | { kind: "paragraph"; segments: InlineSegment[] };

const clean = (text: string): string => text.replace(/[*`]/g, "");

export const splitBold = (line: string): InlineSegment[] =>
  line
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => ({ text: clean(part), bold: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);

export const parseSummaryBlocks = (markdown: string): SummaryBlock[] =>
  markdown
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): SummaryBlock => {
      const heading = /^#{1,6}\s*(.*)$/.exec(line);
      if (heading) {
        return { kind: "heading", segments: splitBold(heading[1] ?? "") };
      }
      const numbered = /^(\d+)\.\s+(.*)$/.exec(line);
      if (numbered) {
        return {
          kind: "numbered",
          marker: `${numbered[1]}.`,
          segments: splitBold(numbered[2] ?? ""),
        };
      }
      const bullet = /^[-*+]\s+(.*)$/.exec(line);
      if (bullet) {
        return { kind: "bullet", segments: splitBold(bullet[1] ?? "") };
      }
      return { kind: "paragraph", segments: splitBold(line) };
    })
    .filter((block) => block.segments.length > 0);

const BULLET = "• ";

export const toPlainText = (markdown: string): string =>
  markdown
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, BULLET)
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
