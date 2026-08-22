import type { Config } from "tailwindcss";

// Colors sampled directly from the official AL HAMZA MERIDIAN logo you
// supplied (k-means cluster of the non-transparent pixels). If the marketing
// site's palette differs slightly, adjust these three values — every
// component in the app reads from here, nothing is hard-coded per-component.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#03224F",
          navyLight: "#0B3A78",
          gold: "#C0902F",
          green: "#156428",
        },
      },
    },
  },
  plugins: [],
};
export default config;
