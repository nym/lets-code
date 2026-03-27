import React from "react";
import type { Preview } from "@storybook/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "../app/i18n";
import "../app/app.css";

const preview: Preview = {
  decorators: [
    (Story) => {
      // createMemoryRouter (data router) is required for hooks like useFetcher
      const router = createMemoryRouter([
        {
          path: "*",
          // No-op action: prevents 405 errors when stories submit forms
          action: async () => null,
          element: (
            <I18nextProvider i18n={i18n}>
              <Story />
            </I18nextProvider>
          ),
        },
      ]);
      return <RouterProvider router={router} />;
    },
  ],
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#030712" },
      ],
    },
  },
};

export default preview;
