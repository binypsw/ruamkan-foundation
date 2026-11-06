# F4 data-testid

## /donate/[id]
| testid | อยู่ที่ไหน |
|---|---|
| donate-loading / donate-title / donate-project-title | หัวหน้า / ชื่อโครงการ |
| donate-login-needed / donate-login-link | ยังไม่ล็อกอิน |
| donate-closed | โครงการปิดรับ (ปุ่มยืนยันถูก disable) |
| donate-quick-50 / -500 / -1000 / -2000 | ปุ่มจำนวนเงินด่วน |
| donate-amount-input | ช่องกรอกจำนวนเงิน |
| donate-tip-checkbox | ติ๊กทิป 5% (ค่าเริ่มต้นไม่ติ๊ก) |
| donate-preview-amount / donate-preview-tip / donate-preview-total | สรุปยอดโดยประมาณก่อนกดยืนยัน |
| donate-method-promptpay / -card / -mobile | วิธีจ่าย |
| donate-submit | ปุ่มยืนยัน (POST /api/donations) |
| donate-error | ข้อความ error จาก API ตรง ๆ |
| donate-adjusted | ข้อความเมื่อ adjusted (รับเท่าที่เหลือ/คืนส่วนเกิน) |
| donate-result-amount / -tip / -fee / -net / -tier, donate-total | ตัวเลขจริงจาก API หลังสร้างรายการ (donate-total = payable) |
| donate-qr / donate-qr-ref / donate-countdown / donate-method-note | QR SVG จำลอง · รหัสอ้างอิง · นับถอยหลัง mm:ss · หมายเหตุบัตร/Mobile |
| donate-mock-pay | ปุ่ม "จำลองการจ่ายสำเร็จ" |
| donate-new | สร้างรายการใหม่ (เมื่อ QR หมดอายุ) |
| donate-paid | ข้อความจ่ายสำเร็จ |
| donate-paid-amount / -raised / -donation / -tip / -payable / -fee / -net / -tier | สรุปหลังจ่าย |
| donate-receipt-link / donate-back-project / donate-my-donations-link | ลิงก์หลังจ่าย |

## /receipt/[donationId]
receipt-loading · receipt-title · receipt-login-needed · receipt-login-link · receipt-error · receipt-card · receipt-no · receipt-issued-at · receipt-donor · receipt-project · receipt-amount · receipt-tip · receipt-total · receipt-kind (ordinary/e-Donation) · receipt-print · receipt-back

## /my/donations
| testid | อยู่ที่ไหน |
|---|---|
| my-donations-loading / -title / -login-needed / -login-link | หน้า |
| my-donations-error / my-donations-ok | แจ้งผล |
| refund-empty | ไม่มีรายการให้เลือก |
| refund-item-{donationId} / refund-project-{id} / refund-amount-{id} / refund-deadline-{id} / refund-day-{id} / refund-current-{id} | การ์ดเลือกคืนเงิน |
| refund-choose-refund-{id} / refund-choose-central-{id} | ปุ่มรับเงินคืน / โอนเข้ากองทุนกลาง |
| my-donations-empty / my-donations-table | ประวัติ |
| my-donation-row-{id} / -amount-{id} / -status-{id} / -choice-{id} / -receipt-{id} | แถวประวัติ |
