const BASE = 'http://localhost:5001/api'
const TOKEN_KEY = 'evently_token'

const getToken = () => localStorage.getItem(TOKEN_KEY)

async function request(method, url, body, isFormData = false) {
  const token = getToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const authApi = {
  register:      (body) => request('POST', '/auth/register', body),
  login:         (body) => request('POST', '/auth/login', body),
  profile:       () => request('GET', '/auth/me'),
  updateProfile: (body) => request('PUT', '/auth/profile', body),
  makeAdmin:     (email) => request('POST', '/auth/make-admin', { email }),
  sendOtp:       () => request('POST', '/auth/send-otp'),
  verifyOtp:     (otp) => request('POST', '/auth/verify-otp', { otp }),
}

export const eventApi = {
  list:         (params = {}) => request('GET', `/events?${new URLSearchParams(params)}`),
  get:          (id) => request('GET', `/events/${id}`),
  myEvents:     () => request('GET', '/events/organizer/mine'),
  create:       (body) => request('POST', '/events', body),
  update:       (id, body) => request('PUT', `/events/${id}`, body),
  delete:       (id) => request('DELETE', `/events/${id}`),
  togglePublish:(id) => request('PATCH', `/events/${id}/publish`),
  uploadBanner: (id, file) => {
    const form = new FormData()
    form.append('banner', file)
    return request('POST', `/events/${id}/banner`, form, true)
  },
  getReviews:   (id) => request('GET', `/events/${id}/reviews`),
  addReview:    (id, body) => request('POST', `/events/${id}/reviews`, body),
}

export const bookingApi = {
  create:    (body) => request('POST', '/bookings', body),
  my:        () => request('GET', '/bookings/my'),
  get:       (id) => request('GET', `/bookings/${id}`),
  cancel:    (id) => request('PATCH', `/bookings/${id}/cancel`),
  all:       () => request('GET', '/bookings'),
  verify:    (ref) => request('GET', `/bookings/verify/${ref}`),
  checkIn:   (ref) => request('PATCH', `/bookings/check-in/${ref}`),
  sendEmail: (id) => request('POST', `/bookings/${id}/send-email`),
}

export const dashboardApi = {
  stats:          () => request('GET', '/dashboard/stats'),
  organizerStats: () => request('GET', '/dashboard/organizer'),
}

export const reportApi = {
  booking: (id) => request('GET', `/reports/booking/${id}`),
  event:   (id) => request('GET', `/reports/event/${id}`),
  summary: () => request('GET', '/reports/summary'),
}

export const userApi = {
  list:           () => request('GET', '/users'),
  delete:         (id) => request('DELETE', `/users/${id}`),
  updateRole:     (id, role) => request('PATCH', `/users/${id}/role`, { role }),
  toggleFavorite: (eventId) => request('POST', `/users/favorites/${eventId}`),
  getFavorites:   () => request('GET', '/users/favorites'),
}
