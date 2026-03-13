import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "yjorde43",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  studioHost: "everything-nyc-2026",
  deployment: {
    appId: "iqnz8eukp94bobzaorlf4m8x",
  },
  schemaExtraction: {
    enabled: true,
  },

  typegen: {
    enabled: true,
    path: [
      "../../packages/sanity-queries/src/**/*.{ts,tsx}",
      "../../apps/web/src/**/*.{ts,tsx}",
    ],
    generates: "../../packages/sanity-queries/src/sanity.types.ts",
    overloadClientMethods: true,
  },
});
