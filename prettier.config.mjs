/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 80,
  endOfLine: "lf",
  arrowParens: "always",
  bracketSameLine: false,
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./examples/next/app/globals.css",
  tailwindFunctions: ["cn", "cva"],
  overrides: [
    {
      files: ["**/*.md"],
      options: { proseWrap: "preserve" },
    },
    {
      files: ["apps/docs/**/*.{js,jsx,ts,tsx,mjs,mdx}"],
      options: {
        tailwindStylesheet: "./apps/docs/src/app/global.css",
      },
    },
  ],
};

export default config;
