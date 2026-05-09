import { Label } from "./Label";
import { Input } from "./Input";

interface Props {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}

export function Field({ label, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
