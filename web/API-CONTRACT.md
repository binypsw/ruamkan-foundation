# API-CONTRACT · ร่วมกันทำไม (สัญญากลางของช่วง B)

ทุกงานในช่วง B (A1–A5 ฝั่ง API · F1–F8 ฝั่งหน้าเว็บ) ยึดเอกสารนี้ + `OWNERSHIP.md` · **ห้ามแก้ไฟล์กลาง** ถ้าสัญญาขาด/ขัดกัน ให้ทำตามที่เข้าใจที่สุดแล้วจดใน `web/CONTRACT-NOTES/<ชื่อ>.md` (หัวหน้าจะแก้จุดต่อในช่วง C)

## 0. ข้อตกลงทั่วไป

> ตาราง "ใครเป็นเจ้าของไฟล์ไหน" อยู่ที่ `web/OWNERSHIP.md` (ส่วนหนึ่งของสัญญานี้)

| เรื่อง | ข้อตกลง |
|---|---|
| **`:id` ของโครงการ** | ทุก path ที่มี `:id`/`:projectId` ของโครงการ รับ **UUID หรือรหัส (`P01`)** ได้ ให้เรียก `await resolveProjectId(params.id)` จาก `lib/resolve.ts` ก่อนใช้เสมอ · ฟิลด์ `projectId` ใน body ก็ผ่านฟังก์ชันเดียวกัน · response ส่งทั้ง `id` (UUID) และ `code` · ลิงก์หน้าเว็บใช้ `code` ได้ (`/projects/P01`, `/donate/P01`) · id อื่น (donation, milestone ฯลฯ) เป็น UUID เท่านั้น |
| รูปแบบ | JSON · UTF-8 · เวลาเป็น ISO-8601 (`2026-11-06T10:00:00.000Z`) · แสดงผลเป็นเวลาไทย |
| **เงิน** | ใน JSON เป็น **สตริงทศนิยม 2 ตำแหน่ง** เช่น `"1050.00"` (รับเข้าได้ทั้ง number หรือสตริง) · ในโค้ดคิดด้วยสตางค์ (`lib/decimal.ts`) · ห้าม float · ปัดครึ่งขึ้น |
| นาฬิกา | `import { now } from '@/lib/clock'` เท่านั้น · ห้าม `Date.now()` / `new Date()` (ไม่มีอาร์กิวเมนต์) ในโค้ดกฎ/API/หน้าเว็บ · หน้าเว็บใช้ `useNow()` หรือรับ `now` จาก API |
| เซสชัน | คุกกี้ `rk_session` (httpOnly) · `getSessionUser()` · `route({roles:[...]}, handler)` ใน `lib/http.ts` คืน 401/403 ให้เอง |
| error | `{ "error": { "code": "BR_23_MIN_DONATION", "message": "ข้อความไทย", "details": {...}? } }` · หน้าเว็บแสดง `error.message` ตรง ๆ |
| status code | 200/201 สำเร็จ · 400 `VALIDATION` (ฟิลด์ผิด/ขาด `details.field`) · 401 `UNAUTHORIZED` · 403 `FORBIDDEN` (บทบาทไม่ถูก NFR-10) · 404 `NOT_FOUND` · 409 ชนกัน (จองของซ้อน, ลงชื่อซ้ำ) · 422 ผิดกฎมูลนิธิ รหัส `BR_<nn>_<SLUG>` |
| กฎร้าน | อยู่ใน `lib/rules/*` ที่เดียว เรียกจาก API ทุกเส้น · ห้ามเชื่อค่าจากเบราว์เซอร์ (เช่น tip, fee, tier คำนวณฝั่งเซิร์ฟเวอร์เสมอ) |
| ภาษา | ข้อความ error/หน้าเว็บเป็นไทยทั้งหมด (NFR-14) · ข้อความหน้าเว็บเก็บใน `src/messages/<ชื่อ>.ts` ของแต่ละงาน |
| testid | ทุกปุ่ม/ช่องกรอก/ลิงก์/ผลลัพธ์/ข้อความ error มี `data-testid` ตามกติกาใน `lib/testid.ts` และมี accessible name (NFR-19) · ใช้คอมโพเนนต์ใน `components/ui` (รับ `testid`) |
| ทรานแซกชัน | ใช้ `tx(async c => …)` จาก `lib/db.ts` · ส่ง `c` ต่อให้ `ledgerIn/ledgerFee/ledgerOut`, `audit`, `notify` |
| ledger | เงินเข้า/ออก wallet ต้องผ่าน `lib/ledger.ts` เท่านั้น (เพิ่มอย่างเดียว) · ห้าม UPDATE `wallets.balance` เอง |
| audit | ทุกการอนุมัติ/ปฏิเสธ/ปลดล็อกงวด/จ่าย/ระงับ/ปลดระงับ/ปิดโครงการ เรียก `audit(c, actorId, action, projectId, detail)` |
| แจ้งเตือน | `notify(c, userId, {kind,title,body,projectId})` = "ส่ง LINE" จำลอง (แสดงที่ `/notifications`) · `notifyRole(c,'staff',…)` แจ้งทั้งบทบาท |
| ข้อมูลอ่อนไหว | API สาธารณะ **ห้าม** ส่งเลขบัตร ที่อยู่ละเอียด ประวัติรักษา (BR-30, NFR-06): ห้าม select คอลัมน์ `*_enc`, `medical_enc`, `address_detail_enc`, `id_card_*` ออกไปนอกบทบาทที่มีสิทธิ์ · ใช้ `donorLabel()` ใน `lib/privacy.ts` กับชื่อผู้บริจาค (BR-25) |
| ไฟล์อัปโหลด | `POST /api/uploads` (multipart `file`) → `{url:"/api/files/<uuid>.<ext>"}` เก็บใน volume · ใช้ `url` ที่ได้ใส่ฟิลด์ต่าง ๆ |

### รหัสผู้ใช้ seed (รหัสผ่านทุกบัญชี `Test@1234`)
U01 somsri (starter, KYC ผ่าน) · U02 boonma (starter, **ไม่ผ่าน KYC**) · U03 noi (starter) · U04 may (helper, ยินยอมแสดงชื่อ) · U05 ton (helper, ไม่ยินยอม) · U06 wichai (helper ช่างไฟ) · U07 thong / U08 kaew / U09 nid / U10 yai (voucher) · U11 staff · U12 wipa (finance) · U13 somchai (exec) · U14 tester (helper) — อีเมล `<ชื่อ>@test.local` ตาม TEST-DATA §2

## 1. สถานะและโมเดลโครงการ (ทุกคนต้องเข้าใจตรงกัน)

- `projects.status`: `pending` → (`active` | `rejected`) · `active` ⇄ `suspended` (ร้องเรียนครบเกณฑ์ `frozen=true`) · `closed`
- **รับบริจาคได้ก็ต่อเมื่อ**: `status='active'` AND `fundraising_state='open'` AND ยังไม่ถึง `ends_at` AND ยอดที่จ่ายแล้วรวม < 120% ของเป้า (BR-06) · ไม่งั้น 422 `BR_06_CLOSED` ("โครงการปิดรับบริจาคแล้ว")
- **ครบเวลา หรือยอดถึง 120%** (FR-63/64) งานปิดรับ (`runExpiryJob` + ตอนบริจาคแล้วถึงเพดาน) ตั้ง `fundraising_state='ended'` แล้ว:
  - `all_or_nothing`: ยอดจ่ายแล้ว ≥ เป้า → `outcome='success'` (status ยัง `active` เพื่อเบิกงวด จนกว่าเจ้าหน้าที่ปิดโครงการ) · ไม่ถึง → `outcome='failed'`, `status='closed'`, `closed_at=now` และแจ้งผู้บริจาคทุกคน (เปิดช่วงเลือกคืนเงิน/กองทุนกลาง 7 วัน BR-07)
  - `flexible`: `outcome='success'` เสมอ (เบิกต่อตามงวด BR-08)
  - ปิดโครงการจริง (เจ้าหน้าที่) → `status='closed'`, `closed_at` (BR-29: ต้องมีรูป Before+After · BR-32: ต้นเรื่องปิดเองไม่ได้)
- `activated_at` = เวลาอนุมัติ (BR-04) · `ends_at = activated_at + duration_hours` (360/720/72) · ขณะ pending ไม่เริ่มนับ
- ข้อ "ยอดแล้ว" = `SUM(donations.amount) WHERE status='paid'` (ไม่รวมทิป ไม่หักค่าธรรมเนียม) · ยอดบัญชีพัก = `wallets.balance`
- **BR-09 ↔ BR-10**: งวดแรก ≤ 40% ใช้กับแผน all_or_nothing ที่มี ≥ 2 งวด · แผน 1 งวด (100%) ทำได้เมื่อเป้า ≤ 20,000 (BR-10, E37) · `flexible` เบิกตามยอดสะสม (BR-08) ไม่ใช้แผน % (สร้างแถว milestones ตอนขอเบิก) — ตรวจใน `lib/rules/milestones.ts`
- BR-22 ใบเสร็จออกทันทีที่จ่ายสำเร็จ (ในวันเดียวกัน) · `runReceiptJob` ตรวจว่ามีรายการจ่ายแล้วที่เกินกำหนด 1 วันทำการแต่ไม่มีใบเสร็จหรือไม่
- เส้นแบ่งวัน "วันที่ N" (BR-07, 15, 33) = `calendarDaysBetween(start, now)` ใน `lib/rules/dates.ts` · วันทำการ (BR-16, 22) = `businessDeadlineEnd(from, n)`
- เกณฑ์ผู้รับรอง `projects.required_vouchers` (ค่าเริ่มต้น 2) · นับเฉพาะผู้รับรองที่ `status='submitted'` และห่าง ≤ 5.00 กม. (ปัดเศษ 2 ตำแหน่ง) · ไม่ใช่ครัวเรือนเดียวกับต้นเรื่อง (`users.household_id`)
- ระยะทาง = haversine (R = 6371 กม.) จาก `users.home_lat/lng` ของผู้รับรอง ถึง `projects.lat/lng` ปัดเป็น 2 ตำแหน่งแล้วเทียบ `<= 5.00`

## 2. โครงสร้างข้อมูลที่ API ส่งออก (shape กลาง)

```ts
// ProjectCard (รายการหน้าแรก) — A1
{ id, code, title, status, fundingMode, urgent, areaProvince, supportTypes: SupportType[],
  endsAt: string|null, activatedAt: string|null,
  bars: ProgressBars /* @/types: money{raised,target,pct} item{needed,reserved,pct} people{needed,joined,pct} (มีเฉพาะประเภทที่โครงการขอ) */,
  acceptingDonations: boolean, starterName: string }

// ProjectDetail (GET /api/projects/:id) — A1 (public: ห้ามมีข้อมูลอ่อนไหว)
{ ...ProjectCard, storyWhat, storyWhere, storyNeed, evidenceUrl, voiceUrl, videoUrl, transcript, lat, lng,
  goalAmount /*=target*/, durationHours, outcome, fundraisingState, frozen, suspendReason, rejectReason /*เฉพาะเจ้าของ/staff*/,
  closing: { beforeUrl, afterUrl, thanksVideoUrl }|null,
  items: [{ id, name, needed, reserved, remaining }],
  skills: [{ id, skill, headcount, joined, workDate, checkedIn }],
  loanRequests: [{ id, itemName, days, activeLoan: boolean }],
  rewardTiers: [{ tier, minAmount, description }],
  milestones: [{ id, seq, percent, amount, status }],
  signatures: { goal: number|null, count: number },
  vouchers: { required, accepted },     // จำนวนผู้รับรองที่นับได้
  now: string }
```
- `bars.money.pct = raised / target × 100` (ทศนิยม 1 ตำแหน่ง ตัดได้ถึง 120) · `bars.item` = Σreserved / Σneeded · `bars.people` = Σjoined / Σheadcount
- ชื่อผู้บริจาค/ผู้ใช้ในหน้าสาธารณะผ่าน `donorLabel(consentShowName, displayName)` → "ผู้ไม่ประสงค์ออกนาม" เมื่อไม่ยินยอม (BR-25)

## 3. Endpoint ทั้งหมด (เจ้าของ = งาน API ที่เขียน route)

บทบาท: `*` ทุกคน (รวมไม่ล็อกอิน) · `auth` ล็อกอินแล้ว · ชื่อบทบาทอื่นคือจำกัดเฉพาะบทบาทนั้น (อื่น ๆ → 403)

### A3 สมาชิก · `src/app/api/{auth,me,kyc,notifications,staff/users}` · `lib/members.ts` · `lib/rules/members.ts`
| method path | บทบาท | body → response |
|---|---|---|
| POST `/api/auth/register` | * | `{email,password,displayName,role:'starter'\|'helper'\|'voucher',consentShowName?,address?,province?,homeLat?,homeLng?,householdId?}` → 201 `{user}` · อีเมลซ้ำ 409 `EMAIL_TAKEN` · รหัสผ่าน ≥ 8 ตัว |
| POST `/api/auth/login` | * | `{email,password}` → `{user: SessionUser}` + ตั้งคุกกี้ `rk_session` · ผิด 401 `INVALID_CREDENTIALS` "อีเมลหรือรหัสผ่านไม่ถูกต้อง" (ตรวจ `password_hash = crypt($pw, password_hash)` ใน SQL) |
| POST `/api/auth/logout` | * | → `{ok:true}` ลบคุกกี้ |
| GET `/api/me` | * | → `{user: SessionUser\|null}` |
| PATCH `/api/me` | auth | `{displayName?,consentShowName?,skills?:string[],lineLinked?,address?,province?,homeLat?,homeLng?}` → `{user}` (FR-34 ทักษะ · FR-45 เชื่อม LINE) |
| POST `/api/kyc` | auth | `{idCard:"13 หลัก", faceScannedBy:'self'\|'other', assistedBy?:string}` → `{verified:true}` · `faceScannedBy='other'` → 422 `BR_31_FACE_BY_OTHER` (BR-31/E60) · `assistedBy` (จุดบริการ/ผู้รับรองช่วยกดเครื่อง) อนุญาต (FR-67) · เก็บเลขบัตรเข้ารหัส `pgp_sym_encrypt(…, DATA_KEY())` (NFR-05) |
| GET `/api/kyc` | auth | → `{verified, verifiedAt, idCardMasked:"x-xxxx-xxxxx-34-5"?}` |
| GET `/api/notifications` | auth | → `{items:[{id,channel,kind,title,body,projectId,read,createdAt}], unread}` (ของตัวเอง ใหม่สุดก่อน) |
| POST `/api/notifications/read` | auth | `{ids?:string[]}` ไม่ส่ง=ทั้งหมด → `{ok:true}` |
| GET `/api/staff/users/:id/sensitive` | staff,finance | → `{address, idCard}` ถอดรหัส (FR-61 จำกัดสิทธิ์) · บทบาทอื่น 403 |
| GET `/api/staff/users` | staff,finance | → `{users:[{id,code,email,role,displayName,kycVerified}]}` (ไม่มีข้อมูลอ่อนไหว) |

### A1 โครงการ · `src/app/api/{projects,my/projects,uploads,voucher,staff/projects}` · `lib/projects.ts` · `lib/rules/projects.ts` · `lib/jobs/projects.ts`
| method path | บทบาท | body → response |
|---|---|---|
| POST `/api/uploads` | auth | multipart `file` (รูป/เสียง/วิดีโอ/pdf ≤ 25MB) → 201 `{url,name}` · `lib/storage.ts` |
| POST `/api/projects` | starter | ส่งโครงการ (wizard ส่งครั้งเดียว): `{title, supportTypes[1..5], fundingMode, targetAmount, durationHours:360\|720\|72, storyWhat, storyWhere, storyNeed, evidenceUrl?, voiceUrl?, videoUrl?, transcript?, lat, lng, areaProvince, medical?, addressDetail?, items?:[{name,qty}], skills?:[{skill,headcount,workDate}], loans?:[{itemName,days}], signatureGoal?, droneWanted?, rewardTiers?:[{tier,minAmount,description}], milestones?:[{percent}]}` → 201 `{project:{id,code,status:'pending'}}` · ตรวจตามลำดับ: ยังไม่ผ่าน KYC 422 `BR_31_KYC_REQUIRED` "กรุณายืนยันตัวตน (e-KYC) ก่อนส่งโครงการ" (FR-02) · ไม่เลือกรูปแบบ 422 `FR_05_NO_SUPPORT_TYPE` · ขาดคำถามบังคับ (ไม่มีเสียง/วิดีโอและไม่ตอบ 3 ข้อ) 400 `VALIDATION` (FR-13; มีเสียงหรือวิดีโอแล้ว storyWhat/Need ว่างได้ FR-10) · เป้า >500,000 `BR_01_TARGET_MAX` "เป้าเงินต้องอยู่ระหว่าง 1,000–500,000 บาท" · <1,000 `BR_02_TARGET_MIN` (ข้อความเดียวกัน) · duration ไม่ใช่ 360/720/72 `BR_03_DURATION` · แผนงวดผิด (เรียก `validatePlan` ของ A5) · บันทึก `status='pending'`, `submitted_at=now`, สร้าง wallet (กรณีไม่มี), notifyRole staff |
| PUT `/api/projects/:id` | starter (เจ้าของ) | แก้ไขและส่งใหม่หลังถูกปฏิเสธ (body เหมือน POST) → `{project}` · ต้อง status `rejected` · `resubmit_count` ≥ 2 → 422 `BR_18_RESUBMIT_LIMIT` "ส่งใหม่ได้ไม่เกิน 2 ครั้ง ปิดเรื่องแล้ว" (E57) · สำเร็จ: count+1, status `pending` |
| GET `/api/projects` | * | query `area`,`type`,`q` → `{projects:ProjectCard[], now}` **เฉพาะ status=active** (FR-23; ไม่รวม suspended/pending) เรียงใกล้หมดเวลาก่อน |
| GET `/api/projects/:id` | * | → `ProjectDetail` · pending/rejected เห็นได้เฉพาะเจ้าของ+staff (อื่น 404) · closed/suspended/active เปิดดูได้ |
| GET `/api/my/projects` | starter | → `{projects:[{id,code,title,status,statusLabel,rejectReason,suspendReason,resubmitCount,canResubmit,endsAt,bars,vouchers:{required,accepted},reviewDueAt,milestonesSummary}], now}` (FR-65) |
| GET `/api/voucher/tasks` | voucher | (pending ทุกโครงการ + โครงการที่ voucher เคยรับ/ถูกถามด้วย `?projectId=`) → `{tasks:[{projectId,code,title,areaProvince,distanceKm,eligible,reason?,myStatus:null\|'taken'\|'submitted',takenAt}]}` เฉพาะ pending · แสดง eligible ตาม BR-13/14 (FR-48) |
| POST `/api/voucher/tasks/:projectId/take` | voucher | → 201 `{vouching}` · ไกล >5.00 กม. 422 `BR_13_TOO_FAR` "ผู้รับรองต้องอยู่ห่างไม่เกิน 5.0 กม." (E48) · ครัวเรือนเดียวกับต้นเรื่อง 422 `BR_14_RELATIVE` "ผู้รับรองห้ามเป็นญาติหรืออยู่ครัวเรือนเดียวกับต้นเรื่อง" (E49) |
| POST `/api/voucher/tasks/:projectId/submit` | voucher | `{photoUrl, note?}` → `{vouching}` · ต้องแนบรูป 400 · ต้องเคยรับงาน (FR-49) |
| GET `/api/staff/projects` | staff | query `status` → `{projects:[{id,code,title,status,urgent,submittedAt,reviewDueAt,overdue,vouchersAccepted,vouchersRequired,starterName}], now}` (BR-16/17: `reviewDueAt` = `urgent ? submittedAt+24h : businessDeadlineEnd(submittedAt,3)`, `overdue = now > reviewDueAt`) |
| GET `/api/staff/projects/:id` | staff | → รายละเอียดครบสำหรับตรวจ: ProjectDetail + `{voiceUrl,videoUrl,transcript,vouchings:[{voucherName,distanceKm,status,photoUrl,note}],reviews[],sensitive:{medical,addressDetail}}` (ถอดรหัสได้เฉพาะ staff) |
| POST `/api/staff/projects/:id/approve` | staff | `{}` → `{project}` · ต้อง pending · ผู้รับรองที่นับได้ < `required_vouchers` → 422 `BR_12_VOUCHERS` "ต้องมีผู้รับรองที่ส่งผลแล้วอย่างน้อย 2 คน" (E50/E51) · ตั้ง `status='active'`, `activated_at=now`, `ends_at`, insert `reviews`, `audit('approve')`, notify เจ้าของ (FR-51) |
| POST `/api/staff/projects/:id/reject` | staff | `{reason}` (บังคับ) → `{project}` status `rejected`, `reject_reason`, audit, notify (FR-51) |
| PATCH `/api/staff/projects/:id/settings` | staff | `{requiredVouchers:number}` → `{project}` (FR-53, ≥1) |
| lib `lib/jobs/projects.ts` | — | `runVoucherReleaseJob()` BR-15: vouchings `taken` ที่ `calendarDaysBetween(taken_at, now) >= 4` → `released` (วันที่ 3 ยังถือ) · `runReviewOverdueJob()` BR-16/17: pending เกินกำหนดและยังไม่ `review_overdue_notified` → notifyRole staff + ตั้ง flag · ทั้งคู่คืน `JobResult` |

### A2 เงิน · `src/app/api/{donations,payments,receipts,me/donations,me/refund-choices,staff/projects/[id]/close,my/projects/[id]/closing}` · `lib/rules/money.ts` (+`money.test.ts`) · `lib/donations.ts` · `lib/jobs/money.ts`
| method path | บทบาท | body → response |
|---|---|---|
| POST `/api/donations` | auth | `{projectId, amount, tip:boolean, method:'promptpay'\|'card'\|'mobile'}` → 201 `{donation:{id,status:'pending',amount,tip,fee,payable,net,tier},qr:{ref,payload,expiresAt},adjusted:boolean,excessRefunded:Money}` · <20 → 422 `BR_23_MIN_DONATION` "บริจาคขั้นต่ำ 20 บาท" (E01) · ปิดรับ 422 `BR_06_CLOSED` "โครงการปิดรับบริจาคแล้ว" (E26) · เกินเพดานรับเท่าที่เหลือ (E25): `amount = remaining`, `adjusted:true`, `excessRefunded` = ส่วนเกิน · ล็อก `SELECT … FROM projects FOR UPDATE` แล้วเทียบ `SUM(paid)+SUM(pending ที่ยังไม่หมดอายุ)` (NFR-12) · tip/fee/tier/payable คำนวณฝั่งเซิร์ฟเวอร์ · QR หมดอายุ 15 นาที (นาฬิการะบบ) |
| GET `/api/donations/:id` | auth (เจ้าของ/staff/finance) | → `{donation,project:{id,code,title},receipt?}` |
| POST `/api/payments/webhook` | * (mock gateway) | `{ref, status:'paid', fee?}` → `{ok:true,donationId}` · idempotent (จ่ายแล้วตอบ ok ซ้ำ) · QR หมดอายุ 422 `QR_EXPIRED` · ทำใน tx เดียว: donation → `paid`, `gateway_fee`=2.5% ปัดครึ่งขึ้น, `ledgerIn(amount)` + `ledgerFee(fee)` ที่ wallet โครงการ, `ledgerIn(tip)` ที่ wallet `admin_fee` (ถ้ามีทิป), สร้าง `receipts` (`receipt_no` `RC-…`, `edonation_sent=false`), notify ผู้บริจาค 2 ข้อความ (LINE ใบเสร็จ + Tier) · ถ้ายอดถึง 120% ตอนนั้น → ตั้ง ended (FR-64) |
| POST `/api/payments/mock/pay` | auth | `{donationId}` → เรียกตรรกะเดียวกับ webhook (ปุ่ม "จำลองการจ่ายสำเร็จ") |
| GET `/api/me/donations` | auth | → `{donations:[{id,project:{id,code,title,status,outcome},amount,tip,status,paidAt,tier,receiptId,refundChoice,refundDeadline,canChoose}]}` |
| GET `/api/receipts/:donationId` | auth (เจ้าของ/finance/staff) | → `{receipt:{receiptNo,issuedAt,donorName,projectTitle,amount,tip,total,edonation:boolean,kind:'ordinary'\|'edonation'}}` (FR-43; `edonation` เฉพาะเงินเข้ากองทุนกลาง BR-21) |
| GET `/api/me/refund-choices` | auth | → `{items:[{donationId,projectTitle,amount,deadline,dayNumber,choice}],now}` ของ donation paid ในโครงการ failed ที่ยังเลือกได้ |
| POST `/api/donations/:id/refund-choice` | auth (เจ้าของ) | `{choice:'refund'\|'central'}` → `{donation}` · ต้องเป็นโครงการ failed และ `calendarDaysBetween(closed_at, now) <= 7` (วันที่ 7 ยังเลือกได้ BR-07; วันที่ 8 → 422 `BR_07_CHOICE_EXPIRED`) · `refund`: ledgerOut จาก wallet โครงการ, donation→`refunded`, notify · `central`: ledgerOut จากโครงการ + ledgerIn wallet `central`, `to_central_fund=true`, **อัปเดตใบเสร็จเดิมของ donation นั้น** (`receipts.donation_id` UNIQUE และ seed มีใบเสร็จครบทุกรายการแล้ว) ตั้ง `edonation_sent=true`; ถ้ายังไม่มีใบเสร็จให้ INSERT (E30, FR-44) · ใบเสร็จของโครงการอื่นที่ไม่เข้ากองทุนต้อง `edonation_sent=false` (BR-21) |
| POST `/api/my/projects/:id/closing` | starter (เจ้าของ) | `{kind:'before'\|'after'\|'thanks', url}` → `{closing}` เก็บใน `projects.closing_*_url` (FR-22) |
| POST `/api/projects/:id/close-request` | starter | `{}` → **ต้องตอบ 403 เสมอ** `BR_32_STARTER_CANNOT_CLOSE` "ต้นเรื่องปิดโครงการเองไม่ได้ กรุณาแจ้งมูลนิธิ" (E31) |
| POST `/api/staff/projects/:id/close` | staff | `{}` → `{project}` · ไม่มี Before+After → 422 `BR_29_NEED_PHOTOS` "ต้องมีรูป Before และ After อย่างน้อยอย่างละ 1 รูปก่อนปิดโครงการ" (E32) · สำเร็จ: status `closed`, audit('close'), notify ทุกคนที่เคยบริจาค/จอง/สมัคร (FR-46) |
| lib `lib/rules/money.ts` | — | `calcDonation({amount, tip:boolean}) → {amount,tip,fee,payable,net,tier:0\|1\|2\|3}` · `tierFor(amount)` · `capacity(target, paidTotal)` · `outcomeFor(mode,target,total)` · ทดสอบค่าขอบ E01–E13 ด้วย vitest · ใช้ `lib/decimal.ts` |
| lib `lib/jobs/money.ts` | — | `runExpiryJob()` ปิดรับโครงการครบเวลา (FR-63) + แจ้งผู้บริจาคกรณี failed · `runRefundJob()` โครงการ failed ที่ `calendarDaysBetween(closed_at, now) >= 8` และผู้บริจาคยังไม่เลือก → คืนเงินอัตโนมัติ (FR-31, E29) · `runReceiptJob()` BR-22 · ทั้งหมดคืน `JobResult` |

### A4 ความช่วยเหลือรูปแบบอื่น · `src/app/api/{items,pledges,volunteer,needs,loan-requests,loans,projects/[id]/{sign,flags,signatures}}` ฯลฯ · `lib/rules/labor.ts` · `lib/flags.ts` · `lib/jobs/loans.ts`
| method path | บทบาท | body → response |
|---|---|---|
| GET `/api/projects/:id/items` | * | → `{items:[{id,name,needed,reserved,remaining}]}` (FR-15) |
| POST `/api/items/:itemId/pledge` | auth | `{qty}` → 201 `{pledge:{id,qty,trackingNo},label:{trackingNo,itemName,qty,projectTitle,recipient:"ศูนย์รับของมูลนิธิร่วมกันทำไม",note}}` · `UPDATE project_items SET qty_reserved = qty_reserved + $qty WHERE id=$1 AND qty_reserved + $qty <= qty_needed` ใน tx (0 แถว → 409 `BR_26_ITEM_FULL`/422 เมื่อ qty > remaining ข้อความ "จองได้ไม่เกินจำนวนที่ยังขาด") (E61–E63, NFR-12) · ต้องเป็นโครงการ active · tracking `RK` + ตัวเลข 10 หลักคงที่จาก id |
| POST `/api/pledges/:id/received` | starter (เจ้าของโครงการ) | → `{pledge}` ยืนยันรับของ (A-11) |
| GET `/api/me/pledges` | auth | → `{pledges:[…]}` |
| GET `/api/volunteer/needs` | auth | → `{needs:[{id,projectId,projectTitle,skill,headcount,joined,workDate,matchesMySkill,signedUp}]}` เรียงที่ตรงทักษะก่อน (FR-35 กฎตายตัว: skill ตรงกับ `users.skills`) |
| POST `/api/volunteer/needs/:needId/signup` | auth | `{}` → 201 · เต็ม 409 `NEED_FULL` · ซ้ำ 409 `ALREADY_SIGNED_UP` |
| GET `/api/needs/:needId/qr` | starter(เจ้าของ),staff | → `{token, payload}` (QR เช็กอินหน้างาน FR-36) |
| POST `/api/volunteer/checkin` | auth | `{token}` → `{checkedIn, total, label:"มาแล้ว X/Y คน", hours?}` (FR-36) · ต้องสมัครไว้ · เช็กอินซ้ำ 409 |
| POST `/api/volunteer/checkins/:signupId/hours` | starter,staff | `{hours}` → `{hours,tierEquivalent:0\|3}` ใช้ `laborTier` (BR-36: <8 ไม่ถึง, ≥8 Tier 3) |
| GET `/api/needs/:needId/stats` | * | → `{headcount, joined, checkedIn, label}` |
| POST `/api/loan-requests/:id/lend` | auth | `{startDate?}` → 201 `{loan:{id,status:'active',startDate,dueDate},contract:{itemName,startDate,dueDate,status,terms}}` (FR-37) · due = start + days (เสมอจากนาฬิการะบบ) |
| POST `/api/loans/:id/return` | auth (ผู้ให้ยืม/เจ้าของ) | → `{loan}` status `returned` |
| GET `/api/me/loans` | auth | → `{loans:[…]}` status คำนวณ `overdue` เมื่อ `due_date < วันนี้` ยังไม่คืน |
| POST `/api/projects/:id/sign` | auth | `{}` → 201 `{count,goal}` · ซ้ำ 409/422 `BR_27_ALREADY_SIGNED` "1 บัญชีลงชื่อได้ 1 ครั้งต่อโครงการ" (E64, UNIQUE) |
| GET `/api/projects/:id/signatures` | * | → `{goal,count,signedByMe}` |
| POST `/api/projects/:id/flags` | auth | `{evidenceUrl, reason?}` → 201 `{flag,distinctReporters,suspended}` · ไม่แนบหลักฐาน 400 `VALIDATION` "กรุณาแนบหลักฐานก่อนแจ้งเบาะแส" (FR-47) · นับ `COUNT(DISTINCT reporter_id)`; ครบ 5 → `status='suspended', frozen=true, suspend_reason`, audit('freeze'), notifyRole staff (BR-28/FR-56, E44) · บัญชีเดิมร้องซ้ำไม่เพิ่ม (E45) · ล็อกแถวโครงการด้วย `FOR UPDATE` |
| GET `/api/staff/flags` | staff | query `projectId?` → `{flags:[{id,projectCode,reporterName,reason,evidenceUrl,createdAt}], projects:[{code,title,distinctReporters,frozen}]}` |
| POST `/api/staff/projects/:id/unsuspend` | staff | `{note?}` → `{project}` `status='active', frozen=false`, audit('unfreeze') (FR-57) |
| lib `lib/jobs/loans.ts` | — | `runLoanOverdueJob()` ตั้ง `loans.status='overdue'` เมื่อเลย due_date |

### A5 เงินงวด/ledger/ทดสอบ · `src/app/api/{milestones,my/projects/[id]/milestones,staff/milestones,projects/[id]/{ledger,supporters},me/rewards,finance,exec,staff/rewards,test}` · `lib/rules/milestones.ts` · `lib/jobs/rewards.ts` · `lib/reset.ts`
| method path | บทบาท | body → response |
|---|---|---|
| GET `/api/my/projects/:id/milestones` | starter (เจ้าของ) | → `{milestones:[{id,seq,percent,amount,status,evidence:[{id,kind,fileUrl}],canRequest,reason?}], balance, flexible:{accumulated,eligible}?, frozen}` |
| POST `/api/milestones/:id/evidence` | starter (เจ้าของ) | `{kind:'receipt'\|'photo', url}` → 201 (FR-21) |
| POST `/api/milestones/:id/request` | starter (เจ้าของ) | `{}` (flexible: `{amount}` สร้างงวดใหม่) → `{milestone}` status `requested` · โครงการ frozen 422 `FR_56_FROZEN` "โครงการถูกระงับการเบิกเงินเพราะมีการร้องเรียน" · งวด seq>1 ต้องงวดก่อนหน้า approved/paid 422 `BR_11_PREV_NOT_APPROVED` "ต้องให้เจ้าหน้าที่อนุมัติงวดก่อนหน้าก่อน" (E41) · flexible ยอดสะสมที่ยังไม่เบิก (ยอดบริจาคก่อนหักค่าธรรมเนียม − ที่เบิกแล้ว) < 10,000 → 422 `BR_08_FLEX_MIN` "ยอดสะสมที่ยังไม่เบิกต้องถึง 10,000 บาทจึงขอเบิกได้" (E38–E40) |
| GET `/api/staff/milestones` | staff | query `status?` → `{milestones:[{id,projectCode,projectTitle,seq,percent,amount,status,frozen,evidence[]}]}` |
| POST `/api/staff/milestones/:id/approve` | staff | `{}` → `{milestone}` status `approved` · frozen 422 `FR_56_FROZEN` · ไม่มีใบเสร็จ+รูป (receipt และ photo อย่างน้อยอย่างละ 1) 422 `BR_11_NEED_EVIDENCE` "ต้องมีใบเสร็จและรูปถ่ายก่อนอนุมัติ" (E42) · audit('release') |
| POST `/api/staff/milestones/:id/pay` | staff | `{payee:'starter'\|'merchant', merchantName?}` (merchant ต้องมีชื่อ ค่าเริ่มต้น "ร้านวัสดุก่อสร้างหนองแสง") → `{disbursement}` · ต้อง `approved` · `ledgerOut` ของ wallet **ของโครงการนั้นเท่านั้น** (BR-34) · status `paid` · audit('pay') · notify เจ้าของ (FR-55) |
| GET `/api/projects/:id/ledger` | * | → `{entries:[{at,kind,amount,payee,memo,donorLabel?}], totals:{in,fee,out,balance}}` ไม่มีข้อมูลอ่อนไหว ชื่อตามความยินยอม (FR-58, BR-25) |
| GET `/api/projects/:id/supporters` | * | → `{supporters:[{label,total,tier}], count}` ทำเนียบ (FR-39/41) รวมยอดรายคนที่จ่ายแล้ว ผู้ไม่ยินยอม = "ผู้ไม่ประสงค์ออกนาม" (BR-25 · E68) |
| GET `/api/me/rewards` | auth | → `{rewards:[{projectId,projectTitle,total,tier,description}]}` (FR-40) |
| GET `/api/staff/rewards` | staff | → `{pending:[{id,projectTitle,tier,description,overdue}]}` · POST `/api/staff/rewards/:id/delivered` (BR-33) |
| GET `/api/finance/reconcile` | finance | → `{ok, rows:[{walletKind,projectCode,balance,ledgerSum,diff}], totalDiff}` (NFR-07 ต้อง 0.00) |
| GET `/api/finance/wallets` | finance | → `{wallets:[…], adminFee, central}` (FR-59) |
| GET `/api/exec/dashboard` | exec | → `{projectsByStatus:{pending,active,suspended,closed,rejected}, moneyIn, moneyOut, fees, tips, pendingReview, now}` (FR-66) |
| POST `/api/test/reset` | * (เมื่อ `ALLOW_TEST_RESET=1` ไม่งั้น 404) | `{now?: ISO}` → `{ok:true, now}` · TRUNCATE ทุกตารางแล้วรัน `seed/02-seed.sql` · `now` ไม่ส่ง = `2026-11-06T10:00:00+07:00` (NFR-17/18) |
| POST `/api/test/clock` | * (เมื่อ ALLOW_TEST_RESET=1) | `{now: ISO}` → `{now}` ตั้งนาฬิกาโดยไม่ล้างข้อมูล |
| POST `/api/test/run-jobs` | * (เมื่อ ALLOW_TEST_RESET=1) | `{jobs?: string[]}` → `{results: JobResult[]}` รันงานตั้งเวลาทั้งหมด (`expiry, refund, receipt, voucherRelease, reviewOverdue, loanOverdue, rewardOverdue`) ตามเวลาที่ล็อกไว้ |
| lib `lib/rules/milestones.ts` | — | `validatePlan({targetAmount, fundingMode, milestones:[{percent}]}) → void` throw `rule()`: BR_10 (เป้า > 20,000 ต้อง ≥ 2 งวด), BR_09 (งวดแรก ≤ 40% เมื่อ ≥ 2 งวด), ผลรวม = 100% · `planAmounts(target, percents) → Money[]` (ปัดครึ่งขึ้น งวดสุดท้ายรับเศษให้ผลรวมตรง) |
| lib `lib/jobs/rewards.ts` | — | `runRewardOverdueJob()` BR-33: โครงการ closed `calendarDaysBetween(closed_at, now) >= 61` ที่ยังมี reward `pending` และ `foundation_notified_at IS NULL` → notifyRole staff แล้วตั้ง `foundation_notified_at` (วันที่ 60 ยังไม่แจ้ง) |

`JobResult = { name: string; affected: number; details: string[] }` (ประกาศใน `lib/jobs/types.ts` ของหัวหน้า)

## 4. หน้าเว็บ (path → เจ้าของ)
| path | งาน | หมายเหตุ |
|---|---|---|
| `/` | F1 | การ์ดโครงการ ค้นหา กรองพื้นที่/ประเภท หลอดแยกประเภท เวลาที่เหลือ |
| `/manifest.webmanifest`, `/sw.js`, `/img/icon-*.png` | F1 | PWA (NFR-03) |
| `/projects/[id]` | F2 | เรื่องเล่า หลอดแยก สิ่งของ (จอง) ทักษะ (สมัคร) ยืม ลงชื่อ ทำเนียบ สมุดบัญชีสาธารณะ ปุ่มแจ้งเบาะแส |
| `/my/projects/new`, `/my/projects`, `/my/projects/[id]`, `/my/projects/[id]/edit` | F3 | wizard ส่งโครงการ · สถานะ/เหตุผล · ส่งใหม่ · ส่งหลักฐานงวด/ขอเบิก · อัปโหลดรูปปิดโครงการ |
| `/donate/[id]`, `/receipt/[donationId]`, `/my/donations` | F4 | บริจาค (QR จำลอง ทิป สรุปยอด) · ใบเสร็จ · เลือกคืนเงิน/กองทุนกลาง |
| `/login`, `/register`, `/kyc`, `/account`, `/notifications` | F5 | |
| `/voucher`, `/volunteer`, `/volunteer/checkin`, `/loans`, `/pledges` | F6 | รับงานรับรอง · อาสา/เช็กอิน QR · ยืม-คืน · ใบปะหน้าของที่จอง |
| `/staff`, `/staff/projects/[id]`, `/staff/milestones`, `/staff/flags` | F7 | ตรวจ/อนุมัติ/ปฏิเสธ · ปลดล็อกงวด/จ่ายตรง · ร้องเรียน/ปลดระงับ · ปิดโครงการ · รางวัลค้างส่ง |
| `/finance`, `/exec` | F8 | สมุดบัญชี/กระทบยอด/แยกบัญชีพัก · แดชบอร์ด |
- ทุกหน้าใช้ layout กลาง (Header/Footer/FloatingHelp ใน `app/layout.tsx`) และคอมโพเนนต์ใน `components/ui` · ห้ามสร้าง design ใหม่ขัดกับ `globals.css`
- งานหน้าเว็บเขียนข้อความไทยใน `src/messages/<f1..f8>.ts` · คอมโพเนนต์เฉพาะงานไว้ใน `src/components/<f1..f8>/`
- หน้าที่ต้องล็อกอิน: ถ้า `useMe()` ได้ `null` ให้แสดงข้อความ + ลิงก์ไป `/login?next=<path>` (หน้า login ส่งกลับตาม `next`)
- ปุ่มที่ API อาจตอบ error: แสดง `error.message` ใน `<Alert kind="error" testid="<ส่วน>-error">` เสมอ

## 5. data-testid กลางที่มีอยู่แล้ว (อย่าซ้ำ)
`site-header` `nav-brand` `nav-menu-toggle` `main-nav` `nav-home` `nav-my-projects` `nav-new-project` `nav-my-donations` `nav-volunteer` `nav-voucher` `nav-staff` `nav-finance` `nav-exec` `nav-notifications` `nav-account` `nav-login` `nav-register` `nav-logout` `page-main` `site-footer` `floating-help`
