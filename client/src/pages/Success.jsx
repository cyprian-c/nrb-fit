import { useEffect, useState, useRef } from 'react'
import { fetchOrder } from '../api/stripeClient.js'
import OrderConfirmation from '../components/OrderConfirmation.jsx'

export default function Success({ onGoToPortal, onBackToHome }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pollCountRef = useRef(0)
  const pollTimerRef = useRef(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setError('No Stripe session ID was provided in the return URL.')
      setLoading(false)
      return
    }

    let isMounted = true

    async function loadOrderStatus() {
      try {
        const data = await fetchOrder({ session_id: sessionId })
        if (!isMounted) return

        const currentOrder = data.order || data
        setOrder(currentOrder)
        setLoading(false)

        // If order is still pending (e.g. webhook has slight latency), poll up to 10 times
        if (currentOrder?.status === 'pending' && pollCountRef.current < 10) {
          pollCountRef.current += 1
          pollTimerRef.current = setTimeout(loadOrderStatus, 2000)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Unable to retrieve order details.')
        setLoading(false)
      }
    }

    loadOrderStatus()

    return () => {
      isMounted = false
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-4 py-16">
      {loading && (
        <div className="flex flex-col items-center gap-3">
          <span className="h-4 w-4 animate-ping rounded-full bg-[#c8f31d]" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777a73]">
            Retrieving payment confirmation...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-800">Order Verification Notice</p>
          <p className="mt-2 text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={onBackToHome}
            className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#c8f31d] hover:text-[#10110f]"
          >
            Return to Studio
          </button>
        </div>
      )}

      {order && !loading && (
        <OrderConfirmation
          order={order}
          onGoToPortal={onGoToPortal}
          onBackToHome={onBackToHome}
        />
      )}
    </div>
  )
}
