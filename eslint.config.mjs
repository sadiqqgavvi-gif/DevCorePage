import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Vendored from 21st.dev and kept close to their source, so they are updated rather than rewritten.
  {
    files: [
      "components/ui/dither-helix-carousel.tsx",
      "components/ui/image-trail.tsx",
      "components/ui/liquid-sculpture-hero.tsx",
      "components/ui/prism-comet-preloader.tsx",
      "components/ui/scroll-locked-video-hero.tsx",
      "components/ui/starship-shader.tsx",
      "components/ui/water-ripple-carousel.tsx",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
