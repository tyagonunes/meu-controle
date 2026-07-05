"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  formatMonthYearShort,
  getDashboardMonthOptions,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type DashboardMonthNavProps = {
  year: number;
  month: number;
};

export const DashboardMonthNav = ({ year, month }: DashboardMonthNavProps) => {
  const router = useRouter();
  const { current, previous, next } = getDashboardMonthOptions();

  const options = [
    { key: "previous", label: "Mês anterior", ...previous },
    { key: "current", label: "Mês atual", ...current },
    { key: "next", label: "Próximo mês", ...next },
  ] as const;

  const handleSelect = (selectedYear: number, selectedMonth: number) => {
    const params = new URLSearchParams({
      ano: String(selectedYear),
      mes: String(selectedMonth),
    });
    router.push(`/?${params.toString()}`);
  };

  return (
    <div
      className="inline-flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:rounded-lg sm:border sm:p-1"
      role="group"
      aria-label="Selecionar mês"
    >
      {options.map((option) => {
        const isSelected = option.year === year && option.month === month;

        return (
          <Button
            key={option.key}
            type="button"
            variant={isSelected ? "secondary" : "ghost"}
            className={cn(
              "h-auto min-h-9 flex-1 justify-center px-3 py-2 sm:flex-none",
              isSelected && "shadow-sm"
            )}
            onClick={() => handleSelect(option.year, option.month)}
            aria-pressed={isSelected}
          >
            <span className="flex flex-col items-center gap-0.5 leading-tight">
              <span className="text-xs font-normal text-muted-foreground">
                {option.label}
              </span>
              <span className="text-sm font-medium capitalize">
                {formatMonthYearShort(option.year, option.month)}
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
};
