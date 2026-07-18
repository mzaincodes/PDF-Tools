"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Tool, ToolOption } from "@/types";

export type OptionValues = Record<string, string | number | boolean>;

export function defaultOptionValues(tool: Tool): OptionValues {
  const values: OptionValues = {};
  for (const opt of tool.options ?? []) {
    values[opt.id] = opt.default ?? (opt.type === "switch" ? false : "");
  }
  return values;
}

interface OptionsFormProps {
  tool: Tool;
  values: OptionValues;
  onChange: (id: string, value: string | number | boolean) => void;
}

export function OptionsForm({ tool, values, onChange }: OptionsFormProps) {
  const options = (tool.options ?? []).filter((opt) => {
    if (!opt.showWhen) return true;
    return values[opt.showWhen.id] === opt.showWhen.equals;
  });

  if (!options.length) return null;

  return (
    <div className="space-y-6">
      {options.map((opt) => (
        <Field key={opt.id} option={opt} value={values[opt.id]} onChange={(v) => onChange(opt.id, v)} />
      ))}
    </div>
  );
}

function Field({
  option,
  value,
  onChange,
}: {
  option: ToolOption;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const { type, label, help } = option;

  if (type === "switch") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card/50 p-4">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {help && <p className="mt-0.5 text-xs text-muted-foreground">{help}</p>}
        </div>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }

  if (type === "radio") {
    return (
      <div className="space-y-2.5">
        <Label className="text-sm font-medium">{label}</Label>
        <RadioGroup value={String(value)} onValueChange={onChange} className="grid gap-2.5 sm:grid-cols-3">
          {option.options?.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all",
                String(value) === o.value
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "hover:border-primary/40 hover:bg-accent/50"
              )}
            >
              <RadioGroupItem value={o.value} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{o.label}</span>
                {o.description && (
                  <span className="block text-xs text-muted-foreground">{o.description}</span>
                )}
              </span>
            </label>
          ))}
        </RadioGroup>
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
    );
  }

  if (type === "select") {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {option.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
    );
  }

  if (type === "range") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums">
            {String(value)}
            {option.unit ?? ""}
          </span>
        </div>
        <Slider
          value={[Number(value)]}
          min={option.min ?? 0}
          max={option.max ?? 100}
          step={option.step ?? 1}
          onValueChange={(v) => onChange(v[0])}
        />
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
    );
  }

  if (type === "color") {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border bg-transparent p-1"
            aria-label={label}
          />
          <Input value={String(value)} onChange={(e) => onChange(e.target.value)} className="w-32 font-mono text-sm" />
        </div>
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
    );
  }

  // text, number, page-range, password
  const inputType = type === "number" ? "number" : type === "password" ? "password" : "text";
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type={inputType}
        value={String(value ?? "")}
        placeholder={option.placeholder}
        min={option.min}
        max={option.max}
        step={option.step}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
