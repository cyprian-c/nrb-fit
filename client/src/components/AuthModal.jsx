import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { CloseIcon } from './icons.jsx'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
}

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, error: authError } = useAuth()
  const dialogRef = useRef(null)
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState(initialForm)
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    const previousActiveElement = document.activeElement
    dialogRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousActiveElement?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isSignUp = mode === 'signup'
  const title = isSignUp ? 'Create your account.' : 'Welcome back.'

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setValidationError('')
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setValidationError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = form.fullName.trim()
    const trimmedEmail = form.email.trim()

    if (isSignUp && trimmedName.length < 2) {
      setValidationError('Please enter your full name.')
      return
    }

    if (!trimmedEmail || !event.currentTarget.elements.email.checkValidity()) {
      setValidationError('Please enter a valid email address.')
      return
    }

    if (form.password.length < 6) {
      setValidationError('Your password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    setValidationError('')

    try {
      if (isSignUp) {
        await signup({
          fullName: trimmedName,
          email: trimmedEmail,
          password: form.password,
        })
      } else {
        await login(trimmedEmail, form.password)
      }

      setForm(initialForm)
      onClose()
    } catch {
      // AuthContext exposes the request error for the form below.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#10110f]/75 px-4 py-8 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-hidden="true"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex="-1"
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[#e4e5df] bg-white p-6 shadow-2xl outline-none sm:p-9"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute right-5 top-5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-[#10110f]"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#84ae00]">
          NRBFIT member access
        </p>
        <h2 id="auth-modal-title" className="max-w-[12ch] font-[Barlow_Condensed] text-4xl font-extrabold leading-[0.9] tracking-[-0.05em] text-[#10110f] sm:text-5xl">
          {title}
        </h2>
        <p className="mt-3 text-xs leading-5 text-[#555750] sm:text-sm">
          {isSignUp ? 'Save your spot and keep your training moving.' : 'Sign in to manage your visits and bookings.'}
        </p>

        <form className="mt-6 grid gap-3.5" onSubmit={handleSubmit} noValidate>
          {isSignUp && (
            <div>
              <label htmlFor="auth-full-name" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
                Full name
              </label>
              <input
                id="auth-full-name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
                placeholder="e.g. Amani Odhiambo"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] px-3.5 text-sm text-[#10110f] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
              Email address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="e.g. amani@example.com"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] px-3.5 text-sm text-[#10110f] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#10110f]">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder="At least 6 characters"
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#d8dad2] bg-[#fbfbf9] px-3.5 text-sm text-[#10110f] outline-none transition-all duration-200 focus:border-[#84ae00] focus:bg-white focus:ring-2 focus:ring-[#84ae00]/25 shadow-2xs"
              required
              minLength="6"
            />
          </div>

          {(validationError || authError) && (
            <p className="mt-1 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-[#a33b2d]" role="alert">
              {validationError || authError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[#10110f] px-5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-xs transition-all duration-200 hover:bg-[#c8f31d] hover:text-[#10110f] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 border-t border-[#e4e5df] pt-4 text-center text-xs text-[#555750]">
          {isSignUp ? 'Already a member?' : 'New to NRBFIT?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
            className="cursor-pointer font-bold text-[#719500] underline decoration-[#c8f31d] decoration-2 underline-offset-4 hover:text-[#10110f]"
          >
            {isSignUp ? 'Sign In' : 'Create an Account'}
          </button>
        </p>
      </section>
    </div>
  )
}
