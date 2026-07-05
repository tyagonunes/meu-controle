"use client";

type MonthPickerProps = {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
};

export const MonthPicker = ({ year, month, onChange }: MonthPickerProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [newYear, newMonth] = event.target.value.split("-").map(Number);
    onChange(newYear, newMonth);
  };

  const value = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <input
      type="month"
      value={value}
      onChange={handleChange}
      className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-auto"
      aria-label="Selecionar mês"
    />
  );
};
