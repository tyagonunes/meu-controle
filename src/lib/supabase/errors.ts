export const isMissingFixedExpenseEntriesTable = (message: string) =>
  message.includes("fixed_expense_entries") &&
  (message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find the table"));
