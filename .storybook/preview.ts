import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        desktop: {
          name: "Desktop (1440px)",
          styles: { width: "1440px", height: "900px" },
        },
        narrow: {
          name: "Narrow (390px)",
          styles: { width: "390px", height: "844px" },
        },
      },
    },
  },
};

export default preview;
