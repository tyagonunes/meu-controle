"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  name: string;
  options: FormSelectOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
};

const resolveInitialValue = (
  defaultValue: string | undefined,
  options: FormSelectOption[]
) => {
  if (defaultValue && options.some((option) => option.value === defaultValue)) {
    return defaultValue;
  }

  return options[0]?.value ?? "";
};

const FormSelectInner = ({
  name,
  options,
  defaultValue,
  placeholder = "Selecione",
  required,
}: FormSelectProps) => {
  const [value, setValue] = useState(() =>
    resolveInitialValue(defaultValue, options)
  );

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value}
        onValueChange={(newValue) => setValue(newValue ?? "")}
      >
        <SelectTrigger className="w-full" aria-required={required}>
          <span
            className={cn(
              "truncate",
              !options.find((option) => option.value === value) &&
                "text-muted-foreground"
            )}
          >
            {selectedLabel}
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export const FormSelect = (props: FormSelectProps) => (
  <FormSelectInner
    key={`${props.name}-${props.defaultValue ?? ""}-${props.options.map((o) => o.value).join(",")}`}
    {...props}
  />
);
