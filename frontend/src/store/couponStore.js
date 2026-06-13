import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* Mã giảm giá đang áp — persist để mang từ Giỏ hàng sang Thanh toán.
   Chỉ lưu code; tiền giảm luôn được validate lại với subtotal hiện tại. */
export const useCouponStore = create(
  persist(
    (set) => ({
      code: '',
      setCode: (code) => set({ code: (code || '').toUpperCase() }),
      clear: () => set({ code: '' }),
    }),
    { name: 'chin-coupon' },
  ),
)
