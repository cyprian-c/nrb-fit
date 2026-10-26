// QuantityStepper: renders parent-owned quantity state and reports bounded updates through onChange.
export default function QuantityStepper({ label, value, onChange, min = 0, max = 10 }) {
  return (
    <div className="inline-flex items-center justify-between gap-2 rounded-xl border border-[#dfe1d9] bg-white p-1 shadow-2xs">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-[#10110f] transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label={`Decrease ${label} quantity`}
      >
        -
      </button>

      <span className="min-w-7 text-center font-mono text-xs font-bold text-[#10110f]">{value}</span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-[#10110f] transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label={`Increase ${label} quantity`}
      >
        +
      </button>
    </div>
  )
}
