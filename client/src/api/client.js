const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Keep API failures as normal Error objects so callers can show the server's
// validation message without needing to know about the fetch response shape.
export async function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers)
  const hasBody = options.body !== undefined && options.body !== null
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const requestOptions = {
    ...options,
    headers,
    credentials: 'include',
  }

  if (hasBody && !isFormData && typeof options.body !== 'string') {
    requestOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, requestOptions)
  const contentType = response.headers.get('content-type') || ''
  const responseBody = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof responseBody === 'object' && responseBody?.error
      ? responseBody.error
      : `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  return responseBody
}

export async function fetchClasses(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  const { classes } = await apiFetch(`/classes${query}`)
  return classes
}

export async function fetchCoaches() {
  const { coaches } = await apiFetch('/coaches')
  return coaches
}

export async function fetchMemberships() {
  const { memberships } = await apiFetch('/memberships')
  return memberships
}

export async function sendEnquiry(enquiry) {
  return apiFetch('/enquiries', { method: 'POST', body: enquiry })
}

export async function loginUser(credentials) {
  return apiFetch('/auth/login', { method: 'POST', body: credentials })
}

export async function signupUser(account) {
  return apiFetch('/auth/signup', { method: 'POST', body: account })
}

export async function logoutUser() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

export async function fetchMe() {
  return apiFetch('/auth/me')
}

export async function createBooking(booking) {
  return apiFetch('/bookings', { method: 'POST', body: booking })
}

export async function fetchMyBookings() {
  const { bookings } = await apiFetch('/bookings/my')
  return bookings
}