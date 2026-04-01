import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface Condition {
  field: string;
  operator: string;
  value: string | number | string[];
}

interface FieldOption {
  value: string;
  label: string;
}

interface OperatorOption {
  value: string;
  label: string;
}

interface RuleBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  fields: FieldOption[];
  operators: OperatorOption[];
}

export default function RuleBuilder({ conditions, onChange, fields, operators }: RuleBuilderProps) {
  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    onChange([
      ...conditions,
      {
        field: fields[0]?.value ?? "",
        operator: operators[0]?.value ?? "",
        value: "",
      },
    ]);
  };

  const inputClass =
    "w-full py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 placeholder-dark-400 focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 outline-none transition-all duration-150";

  const formatValue = (value: string | number | string[]): string => {
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  };

  const parseValue = (raw: string, currentValue: string | number | string[]): string | number | string[] => {
    if (Array.isArray(currentValue)) {
      return raw.split(",").map((s) => s.trim());
    }
    if (typeof currentValue === "number") {
      const num = Number(raw);
      return isNaN(num) ? raw : num;
    }
    return raw;
  };

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-800/40 transition-colors"
        >
          {index > 0 && (
            <span className="text-xs uppercase tracking-wider text-dark-400 font-medium shrink-0 w-8 text-center">
              AND
            </span>
          )}
          {index === 0 && <span className="shrink-0 w-8" />}

          <select
            value={condition.field}
            onChange={(e) => updateCondition(index, { field: e.target.value })}
            className={inputClass}
          >
            {fields.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, { operator: e.target.value })}
            className={inputClass}
          >
            {operators.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={formatValue(condition.value)}
            onChange={(e) =>
              updateCondition(index, {
                value: parseValue(e.target.value, condition.value),
              })
            }
            className={inputClass}
            placeholder="Value..."
          />

          <button
            onClick={() => removeCondition(index)}
            className="shrink-0 p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        onClick={addCondition}
        className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </button>
    </div>
  );
}
