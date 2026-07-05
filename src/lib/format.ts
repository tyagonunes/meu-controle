import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FixedExpenseCategory, IncomeCategory, IncomeSourceType } from "@/types/database";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const formatDate = (date: string | Date) => {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "dd/MM/yyyy", { locale: ptBR });
};

export const formatMonthYear = (date: string | Date) => {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return format(parsed, "MMMM 'de' yyyy", { locale: ptBR });
};

export const formatMonthYearShort = (year: number, month: number) => {
  const date = new Date(year, month - 1, 1);
  return format(date, "MMM/yyyy", { locale: ptBR });
};

export const categoryLabels: Record<FixedExpenseCategory, string> = {
  moradia: "Moradia",
  utilidades: "Utilidades",
  financiamento: "Financiamento",
  outros: "Outros",
};

export const incomeTypeLabels: Record<IncomeSourceType, string> = {
  fixed: "Fixa mensal",
  variable: "Variável",
};

export const incomeCategoryLabels: Record<IncomeCategory, string> = {
  salario: "Salário",
  freelance: "Freelance",
  investimentos: "Investimentos",
  outros: "Outros",
};

export const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export const toBillingMonthString = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}-01`;

export const getPreviousYearMonth = (year: number, month: number) => {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
};

export const parseYearMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
};
