"use client";

import { useLocale } from "@/i18n/locale-context";

export function QueryState({
  message,
  retry,
}: Readonly<{ message: string; retry?: () => void }>) {
  const { t } = useLocale();

  return (
    <div className="rounded-[20px] border border-[#49404f] bg-[#26222d] p-5 text-[#bbb1c1]">
      <p role={retry ? "alert" : "status"}>{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-[10px] border border-[#49404f] px-3 py-2 text-[#f7f2fa]"
        >
          {t("retry")}
        </button>
      ) : null}
    </div>
  );
}
