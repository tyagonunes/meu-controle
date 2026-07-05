"use client";

import { useRouter } from "next/navigation";
import { MonthPicker } from "@/components/relatorios/month-picker";

type MonthPickerNavProps = {
  year: number;
  month: number;
  basePath: string;
  extraParams?: Record<string, string>;
};

export const MonthPickerNav = ({
  year,
  month,
  basePath,
  extraParams = {},
}: MonthPickerNavProps) => {
  const router = useRouter();

  const handleChange = (newYear: number, newMonth: number) => {
    const params = new URLSearchParams({
      ...extraParams,
      ano: String(newYear),
      mes: String(newMonth),
    });
    router.push(`${basePath}?${params.toString()}`);
  };

  return <MonthPicker year={year} month={month} onChange={handleChange} />;
};
