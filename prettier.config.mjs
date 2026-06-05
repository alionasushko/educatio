/** @type {import('prettier').Config} */
export default {
  printWidth: 80,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.md",
      options: { printWidth: 100, proseWrap: "preserve" },
    },
    {
      files: "*.json",
      options: { printWidth: 120 },
    },
  ],
};
