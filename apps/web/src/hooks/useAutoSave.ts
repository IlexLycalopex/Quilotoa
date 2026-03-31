import { useEffect, useRef } from 'react'
import type { UseFormWatch, FieldValues } from 'react-hook-form'

/**
 * Debounced auto-save hook. Watches form values and fires the mutation
 * after `delay` ms of inactivity. Used across all wizard step forms.
 */
export function useAutoSave<TData extends FieldValues>(
  watch: UseFormWatch<TData>,
  mutation: { mutate: (data: unknown) => void },
  delay = 1500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const subscription = watch((values) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        mutation.mutate(values as TData)
      }, delay)
    })
    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [watch, mutation, delay])
}
