import base from "../../eslint.base.mjs";

export default [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["constructors", "private-constructors"] },
      ],
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    ignores: ["dist/**"],
  },
];
