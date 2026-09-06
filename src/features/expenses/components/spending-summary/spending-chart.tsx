"use client";

import { Cell, Pie, PieChart } from "recharts";
import type { CategorySpendingItemData } from "@/features/expenses/view-types";
import { categoryColorValues } from "@/features/categories/category-color";
import { useLocale } from "@/i18n/locale-context";
import { formatAmount } from "@/utils/format-amount";

export type SpendingChartProps = Readonly<{
  totalMinor: number;
  items: ReadonlyArray<CategorySpendingItemData>;
}>;

export function SpendingChart({ totalMinor, items }: SpendingChartProps) {
  const { t } = useLocale();
  const chartItems =
    items.length < 2 ? items : [items[0], ...items.slice(1).reverse()];
  const nonZero = items.filter(({ percent }) => percent > 0);
  const label = `${t("spending")}: ${
    nonZero.length === 0
      ? t("noSpending")
      : nonZero.map(({ name, percent }) => `${name} ${percent}%`).join(", ")
  }. ${t("total")}: ${formatAmount(totalMinor)}`;

  return (
    <div className="grid min-h-[170px] place-items-center">
      <div role="img" aria-label={label} className="relative size-[156px]">
        <PieChart width={156} height={156} aria-hidden="true">
          <Pie
            data={chartItems}
            dataKey="percent"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={78}
            stroke="none"
            isAnimationActive={false}
          >
            {chartItems.map((item) => (
              <Cell
                key={item.categoryId ?? "unclassified"}
                fill={categoryColorValues[item.color]}
              />
            ))}
          </Pie>
        </PieChart>
        <span className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <strong className="font-medium tabular-nums">
            {formatAmount(totalMinor)}
          </strong>
          <span className="text-[#bbb1c1]">{t("total")}</span>
        </span>
      </div>
    </div>
  );
}
