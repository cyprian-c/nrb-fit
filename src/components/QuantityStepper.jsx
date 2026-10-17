import { useState } from 'react'

// QuantityStepper: a small controlled component reused per item following the parent-owned state pattern.
export default function QuantityStepper({ defaultValue = 1, min = 0, max = 10 }) {
  const [value, setValue] = useState(defaultValue)

  const handleChange = (nextValue) => {
    if (nextValue < min) return
    if (nextValue > max) return
    setValue(nextValue)
  }

  return (
    <div className="flex items-center justify-between gap-3 border border-[#dfe1d9] bg-white">
      <button
        type="button"
        onClick={() => handleChange(value - 1)}
        className="flex h-9 w-9 items-center justify-center text-lg text-[#10110f] transition hover:bg-[#f6f7f3]"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span className="min-w-8 text-center text-sm font-bold text-[#10110f]">{value}</span>

      <button
        type="button"
        onClick={() => handleChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center text-lg text-[#10110f] transition hover:bg-[#f6f7f3]"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
