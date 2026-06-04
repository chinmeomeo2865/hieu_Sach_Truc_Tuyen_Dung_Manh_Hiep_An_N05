const { Resend } = require('resend')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = 'Hiệu Sách Chin <noreply@hieusachchin.vn>'

const STATUS_LABELS = {
  CONFIRMED:  'Đã xác nhận',
  PACKING:    'Đang đóng gói',
  SHIPPING:   'Đang giao hàng',
  DELIVERED:  'Giao thành công',
  CANCELLED:  'Đã hủy',
  RETURNED:   'Đã hoàn trả',
}

function formatVND(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function orderItemsHtml(items) {
  return items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ece7">${i.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ece7;text-align:center">${i.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ece7;text-align:right">${formatVND(i.price * i.qty)}</td>
    </tr>
  `).join('')
}

async function send(to, subject, html) {
  if (!resend) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[Email]', err.message)
  }
}

exports.sendOrderConfirmation = async (order, userEmail) => {
  const id = order._id.toString().slice(-6).toUpperCase()
  await send(userEmail, `Xác nhận đơn hàng #${id} — Hiệu Sách Chin`, `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1714">
      <h2 style="font-size:20px;margin-bottom:4px">Cảm ơn bạn đã đặt hàng!</h2>
      <p style="color:#78716c;margin-top:0">Đơn hàng <strong>#${id}</strong> đã được tiếp nhận.</p>
      <table width="100%" style="border-collapse:collapse;margin:20px 0;font-size:13px">
        <thead><tr style="background:#faf8f5">
          <th style="padding:8px 12px;text-align:left">Sách</th>
          <th style="padding:8px 12px;text-align:center">SL</th>
          <th style="padding:8px 12px;text-align:right">Thành tiền</th>
        </tr></thead>
        <tbody>${orderItemsHtml(order.items)}</tbody>
      </table>
      <p style="text-align:right;font-weight:bold">Tổng cộng: ${formatVND(order.total)}</p>
      <hr style="border:none;border-top:1px solid #e2ddd8;margin:20px 0"/>
      <p style="font-size:12px;color:#a8a29e">Hiệu Sách Chin · 0383 687 670 · Hà Đông, Hà Nội</p>
    </div>
  `)
}

exports.sendStatusUpdate = async (order, status, userEmail) => {
  const id    = order._id.toString().slice(-6).toUpperCase()
  const label = STATUS_LABELS[status] || status
  await send(userEmail, `Đơn hàng #${id}: ${label} — Hiệu Sách Chin`, `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1714">
      <h2 style="font-size:18px;margin-bottom:4px">Cập nhật đơn hàng #${id}</h2>
      <p style="color:#78716c">Trạng thái mới: <strong>${label}</strong></p>
      ${status === 'DELIVERED' ? '<p>Cảm ơn bạn đã mua hàng tại Hiệu Sách Chin! Hãy để lại đánh giá để giúp độc giả khác nhé.</p>' : ''}
      <hr style="border:none;border-top:1px solid #e2ddd8;margin:20px 0"/>
      <p style="font-size:12px;color:#a8a29e">Hiệu Sách Chin · 0383 687 670 · Hà Đông, Hà Nội</p>
    </div>
  `)
}
