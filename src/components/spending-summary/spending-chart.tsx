"use client";

import { Cell, Pie, PieChart } from "recharts";

import type { Locale } from "@/localization/messages";
import type { SpendingCategoryPercentItemData } from "@/types/presentation";
import { categoryColorValues } from "@/utils/category-color";
import { formatAmount } from "@/utils/format-amount";

export type SpendingChartProps = Readonly<{
  label: string;
  totalLabel: string;
  totalMinor: number;
  locale: Locale;
  items: ReadonlyArray<SpendingCategoryPercentItemData>;
}>;

export function SpendingChart({
  label,
  totalLabel,
  totalMinor,
  locale,
  items,
}: SpendingChartProps) {
  const chartItems =
    items.length < 2 ? items : [items[0], ...items.slice(1).reverse()];

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
                key={item.categoryId}
                fill={categoryColorValues[item.color]}
              />
            ))}
          </Pie>
        </PieChart>
        <span className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <strong className="font-medium tabular-nums">
            {formatAmount(totalMinor, locale)}
          </strong>
          <span className="text-[#bbb1c1]">{totalLabel}</span>
        </span>
      </div>
    </div>
  );
}
