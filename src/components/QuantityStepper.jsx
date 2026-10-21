// QuantityStepper: renders parent-owned quantity state and reports bounded updates through onChange.
export default function QuantityStepper({ label, value, onChange, min = 0, max = 10 }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[#dfe1d9] bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="flex h-9 w-9 cursor-pointer items-center justify-center text-lg text-[#10110f] transition hover:bg-[#f6f7f3] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Decrease ${label} quantity`}
      >
        −
      </button>

      <span className="min-w-8 text-center text-sm font-bold text-[#10110f]">{value}</span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="flex h-9 w-9 cursor-pointer items-center justify-center text-lg text-[#10110f] transition hover:bg-[#f6f7f3] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Increase ${label} quantity`}
      >
        +
      </button>
    </div>
  )
}
