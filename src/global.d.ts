export {}

declare global {
  interface Window {
    htmx?: unknown
    optimisticComment?: (form: HTMLFormElement) => void
    clearForm?: (form: HTMLFormElement) => void
  }
}
