import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'

export default function ServicesSection() {
	const { services, servicesLoading, addItem } = useCart()
	const [addingServiceId, setAddingServiceId] = useState(null)
	const [message, setMessage] = useState('')

	async function handleAdd(service) {
		setAddingServiceId(service.id)
		setMessage('')
		const result = await addItem('service', service.id, 1, service)
		setMessage(result.success ? `${service.name} added to your cart.` : result.error)
		setAddingServiceId(null)
	}

	return (
		<section id="studio-add-ons" className="border-t border-[#e4e5df] py-16 sm:py-20" aria-labelledby="add-ons-title">
			<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777a73]">Add to your training</p>
					<h2 id="add-ons-title" className="font-[Barlow_Condensed] text-4xl font-bold leading-none text-[#10110f] sm:text-5xl">
						Studio add-ons<span className="text-[#84ae00]">.</span>
					</h2>
				</div>
				{message && <p className="text-xs font-semibold text-[#50524d]" role="status">{message}</p>}
			</div>

			{servicesLoading ? (
				<p className="py-8 text-sm text-[#777a73]">Loading studio add-ons...</p>
			) : services.length === 0 ? (
				<p className="py-8 text-sm text-[#777a73]">No add-ons are available right now.</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{services.map((service) => (
						<article key={service.id} className="flex min-h-44 flex-col border border-[#e4e5df] bg-white p-5">
							<p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#777a73]">{service.category || 'Studio service'}</p>
							<h3 className="mt-2 font-[Barlow_Condensed] text-2xl font-bold text-[#10110f]">{service.name}</h3>
							{service.description && <p className="mt-2 text-xs leading-5 text-[#555750]">{service.description}</p>}
							<div className="mt-auto flex items-center justify-between gap-3 pt-5">
								<span className="font-[Barlow_Condensed] text-2xl font-bold text-[#10110f]">
									{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(service.price)}
								</span>
								<button
									type="button"
									onClick={() => handleAdd(service)}
									disabled={addingServiceId === service.id}
									className="inline-flex h-9 cursor-pointer items-center justify-center bg-[#10110f] px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f] disabled:opacity-50"
								>
									{addingServiceId === service.id ? 'Adding...' : 'Add to cart'}
								</button>
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	)
}