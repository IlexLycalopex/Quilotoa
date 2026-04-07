import { type UseFormRegister, type FieldError } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency } from '@/lib/utils'

interface FinancialInputRowProps {
  id: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  error?: FieldError
  benchmark?: number
  benchmarkLabel?: string
  prefix?: string
  suffix?: string
  isOverridden?: boolean
  helpText?: string
}

/**
 * Reused for both COI and ROI editable input lines.
 * Shows label, numeric input, benchmark comparison, and override indicator.
 */
export function FinancialInputRow({
  id, label, register, error, benchmark, benchmarkLabel, prefix, suffix, isOverridden, helpText,
}: FinancialInputRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 items-start py-3 border-b last:border-0">
      <div className="col-span-5">
        <Label htmlFor={id} className="font-medium">{label}</Label>
        {helpText && <p className="text-xs text-muted-foreground mt-0.5">{helpText}</p>}
      </div>
      <div className="col-span-3">
        <div className="relative">
          {prefix && <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">{prefix}</span>}
          <Input
            id={id}
            type="number"
            step="any"
            className={cn(prefix && 'pl-7', suffix && 'pr-8', error && 'border-destructive')}
            {...register(id, { valueAsNumber: true })}
          />
          {suffix && <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error.message}</p>}
      </div>
      <div className="col-span-4 text-sm text-muted-foreground pt-2.5">
        {benchmark !== undefined && (
          <span>
            Benchmark: {benchmarkLabel ?? formatCurrency(benchmark)}
            {isOverridden && <span className="ml-2 text-amber-600 text-xs">(overridden)</span>}
          </span>
        )}
      </div>
    </div>
  )
}
