export default function OrderConfirmation({ order, onGoToPortal, onBackToHome }) {
  if (!order) return null

  const isPaid = order.status === 'paid'
  const isPending = order.status === 'pending'
  const isFailed = order.status === 'failed'

  const formattedAmount = order.total_amount
    ? Number(order.total_amount).toLocaleString('en-KE', {
        style: 'currency',
        currency: (order.currency || 'kes').toUpperCase(),
        minimumFractionDigits: 0,
      })
    : 'KES 0'

  return (
    <div className="w-full max-w-xl rounded-3xl border border-[#e4e5df] bg-white p-6 shadow-xl sm:p-10">
      {/* Status Header */}
      <div className="text-center">
        {isPaid && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ba] text-[#638500]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {isPending && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {isFailed && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#777a73]">
          Order Confirmation
        </p>

        <h1 className="mt-1 font-[Barlow_Condensed] text-4xl font-extrabold uppercase tracking-tight text-[#10110f] sm:text-5xl">
          {isPaid ? 'Payment Confirmed' : isPending ? 'Processing Payment' : 'Payment Failed'}
        </h1>

        <p className="mt-2 text-sm text-[#555750]">
          {isPaid
            ? 'Thank you for your purchase. Your membership has been activated.'
            : isPending
              ? 'We are verifying your transaction with Stripe. Please hold on a moment...'
              : 'The transaction could not be completed. You have not been charged.'}
        </p>
      </div>

      {/* Order Details Card */}
      <div className="mt-8 rounded-2xl border border-[#e4e5df] bg-[#f8f8f5] p-5">
        <div className="flex items-center justify-between border-b border-[#e4e5df] pb-3 text-xs">
          <span className="font-semibold text-[#777a73]">Order Reference</span>
          <span className="font-mono font-bold text-[#10110f]">#{order.id}</span>
        </div>

        <div className="flex items-center justify-between border-b border-[#e4e5df] py-3 text-xs">
          <span className="font-semibold text-[#777a73]">Payment Status</span>
          <span
            className={[
              'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
              isPaid
                ? 'bg-[#c8f31d] text-[#10110f]'
                : isPending
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800',
            ].join(' ')}
          >
            {order.status}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#e4e5df] py-3 text-xs">
          <span className="font-semibold text-[#777a73]">Total Amount</span>
          <span className="font-[Barlow_Condensed] text-xl font-bold text-[#10110f]">
            {formattedAmount}
          </span>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777a73]">
              Items
            </span>
            <div className="mt-2 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#10110f]">{item.label}</span>
                    {item.quantity > 1 && (
                      <span className="ml-1.5 text-[#777a73]">× {item.quantity}</span>
                    )}
                  </div>
                  <span className="font-semibold text-[#555750]">
                    KES {(item.total_price || item.unit_price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.stripe_session_id && (
          <div className="border-t border-[#e4e5df] pt-3 text-[10px] text-[#777a73]">
            <span className="font-semibold">Session: </span>
            <span className="font-mono">{order.stripe_session_id}</span>
          </div>
        )}
      </div>

      {/* Action Navigation */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onGoToPortal}
          className="flex-1 cursor-pointer rounded-xl bg-[#10110f] py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98]"
        >
          Go to Member Portal
        </button>
        <button
          type="button"
          onClick={onBackToHome}
          className="flex-1 cursor-pointer rounded-xl border border-[#e4e5df] bg-white py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#10110f] transition-all duration-200 hover:bg-[#f8f8f5] active:scale-[0.98]"
        >
          Back to Studio Home
        </button>
      </div>
    </div>
  )
}
