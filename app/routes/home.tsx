import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Mic } from "lucide-react";

import { database } from "~/database/context";
import i18n from "~/i18n";
import type { Route } from "./+types/home";
import { formatDateTime } from "~/lib/datetime";

export function meta({}: Route.MetaArgs) {
  const t = i18n.t.bind(i18n);
  return [
    { title: t("common.appName") },
    { name: "description", content: t("common.description") },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = database();
  const result = await db.execute<{ now: Date }>("select now()");
  return { csrfToken: context.csrfToken, serverTime: result[0].now };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#50dfc6] dark:bg-gray-950">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">
            {t("common.appName")}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">
            {t("common.description")}
          </p>
          <p className="text-gray-700 dark:text-gray-400">
            {t("common.description2")}
          </p>
        </div>

        {/* Pulsating mic icon */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-white/30 dark:bg-white/10 animate-pulse-ring">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/60 dark:bg-white/20">
              <Mic className="w-10 h-10 text-gray-800 dark:text-gray-100 animate-pulse" />
            </div>
          </div>
        </div>

        <Link
          to="/objectives/"
          className="inline-block px-8 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          {t("home.viewDemo")}
        </Link>
      </div>
    </main>
  );
}
