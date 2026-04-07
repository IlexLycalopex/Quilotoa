import { useEffect, useRef } from 'react'
import type { UseFormWatch, FieldValues } from 'react-hook-form'

/**
 * Debounced auto-save hook. Watches form values and fires the mutation
 * after `delay` ms of inactivity. Used across all wizard step forms.
 */
export function useAutoSave<TData extends FieldValues>(
  watch: UseFormWatch<TData>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: { mutate: (data: any) => void },
  delay = 1500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable ref so the effect doesn't re-subscribe on every render
  const mutationRef = useRef(mutation)
  mutationRef.current = mutation

  useEffect(() => {
    const subscription = watch((values) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        mutationRef.current.mutate(values as TData)
      }, delay)
    })
    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // watch and delay are stable; mutationRef never changes identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, delay])
}
