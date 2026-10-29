const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? '/api'
    : 'http://localhost:5000/api')

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

// Member Portal API Functions
export async function fetchPrograms() {
  const { programs } = await apiFetch('/portal/programs')
  return programs
}

export async function fetchProgramDetail(slug) {
  const { program } = await apiFetch(`/portal/programs/${encodeURIComponent(slug)}`)
  return program
}

export async function enrollProgram(programId) {
  return apiFetch('/portal/enroll', {
    method: 'POST',
    body: { program_id: programId },
  })
}

export async function fetchMyEnrollments() {
  const { enrollments } = await apiFetch('/portal/my-enrollments')
  return enrollments
}

export async function logWorkoutSession(payload) {
  return apiFetch('/portal/log-workout', {
    method: 'POST',
    body: payload,
  })
}

export async function fetchPortalStats() {
  const { stats } = await apiFetch('/portal/stats')
  return stats
}

export async function fetchAlerts() {
  const { alerts } = await apiFetch('/portal/alerts')
  return alerts
}

export async function markAlertRead(alertId = 'all') {
  return apiFetch(`/portal/alerts/${encodeURIComponent(alertId)}/read`, {
    method: 'POST',
  })
}

// Stripe Checkout & Orders
export async function createCheckoutSession(membershipId, quantity = 1) {
  return apiFetch('/checkout/create', {
    method: 'POST',
    body: { membership_id: membershipId, quantity },
  })
}

export async function fetchOrder(params = {}) {
  const queryParam = typeof params === 'object'
    ? '?' + new URLSearchParams(params).toString()
    : `/${params}`
  return apiFetch(`/orders${queryParam}`)
}
