const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export const formatPrice = (amount) => vnd.format(amount)
