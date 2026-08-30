import type { Preview } from "@storybook/nextjs-vite";
import { createElement } from "react";

import "../src/app/globals.css";
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
