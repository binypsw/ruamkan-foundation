# F6 data-testid

`<code>` = รหัสโครงการ (P01) · `<id>` = UUID

| testid | อยู่ที่ไหน |
|---|---|
| voucher-loading / voucher-error / voucher-ok / voucher-empty / voucher-list | /voucher |
| voucher-login-needed / voucher-login-link | /voucher (ยังไม่ล็อกอิน) |
| voucher-task-`<code>` · voucher-status-`<code>` · voucher-distance-`<code>` · voucher-reason-`<code>` | การ์ดงานรับรอง |
| voucher-take-`<code>` · voucher-take-error-`<code>` | ปุ่มรับงาน / error ของปุ่ม |
| voucher-photo-input-`<code>` · voucher-photo-url-`<code>` · voucher-note-input-`<code>` · voucher-note-input-`<code>`-error | ฟอร์มส่งผล |
| voucher-submit-`<code>` · voucher-submit-error-`<code>` | ปุ่มส่งผล / error |
| volunteer-skills-card · volunteer-skills-input · volunteer-skills-save · volunteer-skills-ok · volunteer-skills-error | /volunteer ทักษะ |
| volunteer-checkin-link | ลิงก์ไป /volunteer/checkin |
| volunteer-loading / volunteer-error / volunteer-ok / volunteer-empty / volunteer-list | /volunteer |
| volunteer-login-needed / volunteer-login-link | /volunteer (ยังไม่ล็อกอิน) |
| volunteer-need-`<id>` · volunteer-match-`<id>` · volunteer-signed-`<id>` · volunteer-joined-`<id>` | การ์ดงานอาสา (joined = "X/Y") |
| volunteer-signup-`<id>` · volunteer-signup-error-`<id>` | ปุ่มสมัคร / error |
| volunteer-qr-toggle-`<id>` · volunteer-qr-error-`<id>` · volunteer-qr-panel-`<id>` · volunteer-qr-image-`<id>` · volunteer-qr-token-`<id>` · volunteer-qr-stats-`<id>` | QR เจ้าของ/เจ้าหน้าที่ (stats = "มาแล้ว X/Y คน") |
| checkin-loading · checkin-card · checkin-token-input · checkin-submit | /volunteer/checkin |
| checkin-scan-start · checkin-scan-stop · checkin-video · checkin-scanning · checkin-scan-message | สแกนกล้อง |
| checkin-error · checkin-result · checkin-label · checkin-hours · checkin-back | ผลเช็กอิน (label = "มาแล้ว X/Y คน") |
| checkin-login-needed / checkin-login-link | ยังไม่ล็อกอิน |
| loans-loading / loans-error / loans-ok / loans-empty / loans-list | /loans |
| loans-login-needed / loans-login-link | ยังไม่ล็อกอิน |
| loan-`<id>` · loan-item-`<id>` · loan-status-`<id>` · loan-start-`<id>` · loan-due-`<id>` · loan-returned-`<id>` | การ์ดสัญญา |
| loan-return-`<id>` · loan-error-`<id>` | ปุ่มคืน / error |
| pledges-loading / pledges-error / pledges-empty / pledges-list / pledges-print-all | /pledges |
| pledges-login-needed / pledges-login-link | ยังไม่ล็อกอิน |
| pledge-`<id>` · pledge-tracking-`<id>` · pledge-status-`<id>` · pledge-item-`<id>` · pledge-qty-`<id>` · pledge-project-`<id>` · pledge-recipient-`<id>` | ใบปะหน้า |
| pledge-print-`<id>` | ปุ่มพิมพ์ใบเดียว |
