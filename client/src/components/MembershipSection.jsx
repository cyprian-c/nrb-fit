import { useEffect, useState } from 'react'
import { fetchMemberships } from '../api/client.js'
import { membershipPlans as fallbackMemberships } from '../data/siteData'
import QuantityStepper from './QuantityStepper'

// MembershipSection: shows the studio pricing and includes a reusable stepper used on each item card.
export default function MembershipSection() {
  const [memberships, setMemberships] = useState(fallbackMemberships)
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(fallbackMemberships.map((plan) => [plan.label, 1])),
  )

  useEffect(() => {
    let isMounted = true

    fetchMemberships()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const enriched = data.map((plan) => ({
            ...plan,
            perks: Array.isArray(plan.perks)
              ? plan.perks
              : typeof plan.perks === 'string'
                ? JSON.parse(plan.perks)
                : [],
          }))
          setMemberships(enriched)
          setQuantities((current) => {
            const nextQuantities = { ...current }
            enriched.forEach((plan) => {
              if (nextQuantities[plan.label] === undefined) {
                nextQuantities[plan.label] = 1
              }
            })
            return nextQuantities
          })
        }
      })
      .catch(() => {
        // Fall back gracefully to bundled memberships if API is cold or offline.
      })

    return () => {
      isMounted = false
    }
  }, [])

  const updateQuantity = (label, value) => {
    setQuantities((current) => ({ ...current, [label]: value }))
  }

  return (
    <section id="memberships" className="py-16 sm:py-20" aria-labelledby="memberships-title">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
            Flexible training, clear pricing
          </p>
          <h2 id="memberships-title" className="font-[Barlow_Condensed] text-4xl font-bold leading-none tracking-[-0.05em] text-[#10110f] sm:text-5xl lg:text-6xl">
            Choose your package<span className="text-[#84ae00]">.</span>
          </h2>
        </div>
        <p className="text-right text-[12px] leading-6 text-[#777a73]">
          Pricing in KES.<br />
          Ask us about corporate and personal training.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {memberships.map((plan) => (
          <article
            key={plan.label}
            className={[
              'relative flex min-h-[420px] flex-col rounded-2xl border p-6 transition-all duration-200 hover:shadow-md',
              plan.featured ? 'border-[#10110f] bg-[#f8f8f5] ring-1 ring-[#10110f]' : 'border-[#e4e5df] bg-white hover:border-neutral-400',
            ].join(' ')}
          >
            {plan.featured && (
              <span className="absolute right-5 top-5 rounded-full bg-[#c8f31d] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#10110f] shadow-xs">
                Best for regulars
              </span>
            )}

            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777a73]">
              {plan.label}
            </p>

            <h3 className="max-w-[220px] font-[Barlow_Condensed] text-3xl font-bold leading-tight text-[#10110f]">
              {plan.title}
            </h3>

            <div className="mt-4 flex items-end gap-2 font-[Barlow_Condensed] text-4xl font-extrabold text-[#10110f]">
              <span>{plan.price}</span>
              <span className="mb-1 text-xs font-semibold text-[#777a73]">{plan.suffix}</span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[#555750]">{plan.description}</p>

            <ul className="mt-5 space-y-2.5 border-t border-[#e4e5df] pt-4">
              {plan.perks.map((perk) => (
                <li key={perk} className="relative pl-4 text-xs text-[#10110f] before:absolute before:left-0 before:content-['+'] before:text-[#719500] before:font-bold">
                  {perk}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center justify-between gap-3 pt-6 border-t border-[#e4e5df]">
              <QuantityStepper
                label={plan.label}
                value={quantities[plan.label] ?? 1}
                onChange={(value) => updateQuantity(plan.label, value)}
                min={0}
                max={9}
              />
              <a
                href="#contact"
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
              >
                Enquire
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
