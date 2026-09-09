import type { Preview } from "@storybook/nextjs-vite";
import { createElement } from "react";

import "../src/styles/globals.css";
import { I18nProvider } from "../src/i18n/i18n-provider";
import { getLocale } from "../src/i18n";

const preview: Preview = {
  initialGlobals: {
    locale: "en",
  },
  globalTypes: {
    locale: {
      description: "Interface language",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "es", title: "Español" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = getLocale(String(context.globals.locale));

      return createElement(
        I18nProvider,
        { initialLocale: locale, key: locale },
        createElement(Story),
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        desktop1200: {
          name: "Desktop (1200px)",
          styles: { width: "1200px", height: "900px" },
        },
        desktopConstrained: {
          name: "Desktop constrained (1200×700px)",
          styles: { width: "1200px", height: "700px" },
        },
        desktop: {
          name: "Desktop (1440px)",
          styles: { width: "1440px", height: "900px" },
        },
        dashboardBoundaryAbove: {
          name: "Dashboard boundary above (851px)",
          styles: { width: "851px", height: "900px" },
        },
        dashboardBoundary: {
          name: "Dashboard boundary (850px)",
          styles: { width: "850px", height: "900px" },
        },
        captureBoundaryAbove: {
          name: "Capture Boundary (841px)",
          styles: { width: "841px", height: "900px" },
        },
        captureBoundary: {
          name: "Capture Boundary (840px)",
          styles: { width: "840px", height: "900px" },
        },
        inputBoundaryAbove: {
          name: "Input Boundary (681px)",
          styles: { width: "681px", height: "900px" },
        },
        inputBoundary: {
          name: "Input Boundary (680px)",
          styles: { width: "680px", height: "900px" },
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
