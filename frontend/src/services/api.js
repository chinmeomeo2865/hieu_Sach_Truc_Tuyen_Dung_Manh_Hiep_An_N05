const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getHeaders(extra = {}) {
  const token = localStorage.getItem('chin-token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const data = await res.json()

  if (!data.success) {
    const err = new Error(data.message || 'Có lỗi xảy ra')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
  delete: (path) => request('DELETE', path),
}
