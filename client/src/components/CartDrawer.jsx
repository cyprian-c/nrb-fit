import { useState } from 'react'
import { createCartCheckoutSession } from '../api/stripeClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { CloseIcon } from './icons.jsx'

const formatPrice = (amount) => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
}).format(amount)

export default function CartDrawer({ open, onClose, onRequireAuth }) {
  const { user, loading: authLoading } = useAuth()
  const { cartItems, loading, subtotal, updateItem, removeItem, clearAllItems } = useCart()
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  if (!open) return null

  async function beginCheckout() {
    if (!user) {
      onRequireAuth?.()
      return
    }

    setCheckoutError('')
    setIsCheckingOut(true)
    try {
      const result = await createCartCheckoutSession()
      if (!result?.checkoutUrl) throw new Error('Stripe did not return a checkout link.')
      window.location.assign(result.checkoutUrl)
    } catch (error) {
      setCheckoutError(error.message || 'Could not start checkout.')
      setIsCheckingOut(false)
    }
  }

  async function changeQuantity(item, quantity) {
    const result = await updateItem(item.id, quantity)
    if (!result.success) setCheckoutError(result.error || 'Could not update this item.')
  }

  async function removeCartItem(item) {
    const result = await removeItem(item.id)
    if (!result.success) setCheckoutError(result.error || 'Could not remove this item.')
  }

  async function clearCart() {
    const result = await clearAllItems()
    if (!result.success) setCheckoutError(result.error || 'Could not clear your cart.')
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[#10110f]/45"
        aria-label="Close shopping cart"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[#e4e5df] bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#e4e5df] px-5 py-4 sm:px-7">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#777a73]">Your selection</p>
            <h2 id="cart-title" className="font-[Barlow_Condensed] text-3xl font-bold text-[#10110f]">Shopping cart</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shopping cart" className="grid h-9 w-9 cursor-pointer place-items-center border border-[#e4e5df] hover:bg-[#f6f7f3]">
            <CloseIcon />
          </button>
        </header>

        {checkoutError && <p className="mx-5 mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:mx-7" role="alert">{checkoutError}</p>}

        <div className="flex-1 overflow-y-auto px-5 py-2 sm:px-7">
          {loading ? (
            <p className="py-8 text-sm text-[#777a73]">Loading your cart...</p>
          ) : cartItems.length === 0 ? (
            <div className="py-12">
              <p className="font-[Barlow_Condensed] text-2xl font-bold text-[#10110f]">Your cart is empty.</p>
              <p className="mt-2 text-sm text-[#777a73]">Choose a package or studio add-on to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#e4e5df]">
              {cartItems.map((item) => (
                <li key={item.id} className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#777a73]">
                        {item.item_type === 'membership' ? 'Membership' : item.category || 'Studio add-on'}
                      </p>
                      <h3 className="mt-1 font-[Barlow_Condensed] text-xl font-bold text-[#10110f]">{item.name}</h3>
                      {item.description && <p className="mt-1 text-xs leading-5 text-[#555750]">{item.description}</p>}
                      <p className="mt-2 text-xs font-semibold text-[#10110f]">{formatPrice(item.unit_price)} each</p>
                    </div>
                    <button type="button" onClick={() => removeCartItem(item)} aria-label={`Remove ${item.name}`} className="cursor-pointer p-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#777a73] hover:text-red-700">
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex h-8 items-center border border-[#dfe1d9]">
                      <button type="button" onClick={() => changeQuantity(item, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Decrease ${item.name} quantity`} className="h-full w-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">-</button>
                      <span className="w-9 text-center text-xs font-bold" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(item, item.quantity + 1)} disabled={item.quantity >= 99} aria-label={`Increase ${item.name} quantity`} className="h-full w-8 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">+</button>
                    </div>
                    <span className="text-sm font-bold text-[#10110f]">{formatPrice(item.total_price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-[#e4e5df] bg-[#f8f8f5] px-5 py-5 sm:px-7">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#555750]">Subtotal</span>
            <span className="font-[Barlow_Condensed] text-2xl font-bold text-[#10110f]">{formatPrice(subtotal)}</span>
          </div>
          <button type="button" onClick={beginCheckout} disabled={loading || authLoading || cartItems.length === 0 || isCheckingOut} className="h-11 w-full cursor-pointer bg-[#10110f] px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c8f31d] hover:text-[#10110f] disabled:cursor-not-allowed disabled:opacity-50">
            {isCheckingOut ? 'Connecting to Stripe...' : user ? 'Checkout securely' : 'Sign in to checkout'}
          </button>
          {cartItems.length > 0 && (
            <button type="button" onClick={clearCart} className="mt-3 w-full cursor-pointer py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#777a73] hover:text-[#10110f]">
              Clear cart
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}