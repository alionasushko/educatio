export interface Range {
  min: number;
  max: number;
}

export const rangeOf = (values: number[]): Range =>
  values.reduce<Range>(
    (range, value) => ({
      min: Math.min(range.min, value),
      max: Math.max(range.max, value),
    }),
    { min: Infinity, max: -Infinity },
  );
