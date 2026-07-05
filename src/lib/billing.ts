import { addMonths, differenceInCalendarMonths, parseISO, setDate, startOfMonth } from "date-fns";

export type InstallmentDraft = {
  installment_number: number;
  amount: number;
  billing_month: string;
};

export const getFirstBillingMonth = (
  purchaseDate: Date,
  closingDay: number
): Date => {
  const day = purchaseDate.getDate();
  const baseMonth = startOfMonth(purchaseDate);

  if (day <= closingDay) {
    return baseMonth;
  }

  return startOfMonth(addMonths(purchaseDate, 1));
};

export const getBillingMonthForInstallment = (
  purchaseDate: Date,
  closingDay: number,
  installmentIndex: number
): Date => {
  const firstMonth = getFirstBillingMonth(purchaseDate, closingDay);
  return startOfMonth(addMonths(firstMonth, installmentIndex));
};

export const toBillingMonthDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

export const splitInstallmentAmounts = (
  totalAmount: number,
  installments: number
): number[] => {
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installments);
  const remainder = totalCents - baseCents * installments;

  return Array.from({ length: installments }, (_, index) => {
    const cents = index === installments - 1 ? baseCents + remainder : baseCents;
    return cents / 100;
  });
};

export const generateInstallments = (
  totalAmount: number,
  installments: number,
  purchaseDate: Date,
  closingDay: number
): InstallmentDraft[] => {
  const amounts = splitInstallmentAmounts(totalAmount, installments);

  return amounts.map((amount, index) => ({
    installment_number: index + 1,
    amount,
    billing_month: toBillingMonthDateString(
      getBillingMonthForInstallment(purchaseDate, closingDay, index)
    ),
  }));
};

export const parsePurchaseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return setDate(new Date(year, month - 1, 1), day);
};

export const parseBillingMonth = (billingMonth: string): Date =>
  startOfMonth(parseISO(billingMonth));

export const isRecurringActiveInMonth = (
  purchaseDate: Date,
  closingDay: number,
  billingMonth: string
): boolean => {
  const targetMonth = parseBillingMonth(billingMonth);
  const firstBilling = getFirstBillingMonth(purchaseDate, closingDay);
  return targetMonth >= firstBilling;
};

export const getRecurringInstallmentNumber = (
  purchaseDate: Date,
  closingDay: number,
  billingMonth: string
): number => {
  const targetMonth = parseBillingMonth(billingMonth);
  const firstBilling = getFirstBillingMonth(purchaseDate, closingDay);
  return differenceInCalendarMonths(targetMonth, firstBilling) + 1;
};

export type InvoicePurchaseType = "installment" | "recurring" | "cash";

type PurchaseTypeFields = {
  installments: number;
  is_recurring: boolean;
};

export const getInvoicePurchaseType = (
  purchase: PurchaseTypeFields
): InvoicePurchaseType => {
  if (purchase.is_recurring) return "recurring";
  if (purchase.installments > 1) return "installment";
  return "cash";
};

export const groupInstallmentsByPurchaseType = <
  T extends { purchases: PurchaseTypeFields },
>(
  items: T[]
) => {
  const groups: Record<InvoicePurchaseType, T[]> = {
    installment: [],
    recurring: [],
    cash: [],
  };

  for (const item of items) {
    groups[getInvoicePurchaseType(item.purchases)].push(item);
  }

  return groups;
};
