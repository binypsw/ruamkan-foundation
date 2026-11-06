# OWNERSHIP · ใครเป็นเจ้าของไฟล์ไหน

กฎ: แต่ละงานแก้/สร้างได้เฉพาะไฟล์ในแถวของตัวเอง · ห้ามแก้ไฟล์กลางของหัวหน้า · ห้ามรัน docker · ห้ามทำ BUG_MODE · ห้ามแก้ `db/`
ถ้าต้องการคอลัมน์/ตาราง/ฟังก์ชันกลางที่ไม่มี ให้จดใน `web/CONTRACT-NOTES/<ชื่อ>.md` (ไม่ต้องรอ) แล้วทำงานต่อด้วยสิ่งที่มี

## ไฟล์กลาง (หัวหน้า · ห้ามแก้) — อ่านและ import ได้
`package.json` `next.config.mjs` `tsconfig.json` `Dockerfile` `docker-compose.yml` · `src/types/**` · `src/lib/{db,clock,decimal,http,auth,ledger,audit,notify,storage,testid,format,privacy,resolve}.ts` · `src/lib/rules/dates.ts` · `src/lib/jobs/types.ts` · `src/lib/client/api.ts` · `src/components/{Header,Footer,FloatingHelp,ReadyFlag,SwRegister}.tsx` · `src/components/ui/**` · `src/app/{layout.tsx,globals.css}` · `src/app/api/{health,now,files}/**` · `src/messages/common.ts` · `public/img/{icon.svg,seed-*.svg}` · `seed/**` · `API-CONTRACT.md` · `OWNERSHIP.md`

## งาน API (A1–A5)
| งาน | ไฟล์ที่เป็นเจ้าของ (ทั้งหมดใต้ `web/`) |
|---|---|
| A1 โครงการ | `src/app/api/projects/route.ts` · `src/app/api/projects/[id]/route.ts` · `src/app/api/my/projects/route.ts` · `src/app/api/uploads/**` · `src/app/api/voucher/**` · `src/app/api/staff/projects/route.ts` · `src/app/api/staff/projects/[id]/{route,approve,reject,settings}/**` · `src/lib/projects.ts` · `src/lib/rules/projects.ts` (+ `.test.ts`) · `src/lib/jobs/projects.ts` · `src/messages/a1.ts` |
| A2 เงิน | `src/app/api/donations/**` · `src/app/api/payments/**` · `src/app/api/receipts/**` · `src/app/api/me/donations/**` · `src/app/api/me/refund-choices/**` · `src/app/api/my/projects/[id]/closing/**` · `src/app/api/projects/[id]/close-request/**` · `src/app/api/staff/projects/[id]/close/**` · `src/lib/rules/money.ts` (+ `money.test.ts`) · `src/lib/donations.ts` · `src/lib/jobs/money.ts` · `src/messages/a2.ts` |
| A3 สมาชิก | `src/app/api/auth/**` · `src/app/api/me/route.ts` · `src/app/api/kyc/**` · `src/app/api/notifications/**` · `src/app/api/staff/users/**` · `src/lib/members.ts` · `src/lib/rules/members.ts` (+ test) · `src/messages/a3.ts` |
| A4 อื่น ๆ | `src/app/api/items/**` · `src/app/api/pledges/**` · `src/app/api/me/{pledges,loans}/**` · `src/app/api/volunteer/**` · `src/app/api/needs/**` · `src/app/api/loan-requests/**` · `src/app/api/loans/**` · `src/app/api/projects/[id]/{items,sign,signatures,flags}/**` · `src/app/api/staff/flags/**` · `src/app/api/staff/projects/[id]/unsuspend/**` · `src/lib/rules/labor.ts` (+ test) · `src/lib/flags.ts` · `src/lib/jobs/loans.ts` · `src/messages/a4.ts` |
| A5 งวด/ledger/ทดสอบ | `src/app/api/my/projects/[id]/milestones/**` · `src/app/api/milestones/**` · `src/app/api/staff/milestones/**` · `src/app/api/projects/[id]/{ledger,supporters}/**` · `src/app/api/me/rewards/**` · `src/app/api/staff/rewards/**` · `src/app/api/finance/**` · `src/app/api/exec/**` · `src/app/api/test/**` · `src/lib/rules/milestones.ts` (+ test) · `src/lib/jobs/rewards.ts` · `src/lib/reset.ts` · `src/messages/a5.ts` |

## งานหน้าเว็บ (F1–F8) — หน้าเว็บ + คอมโพเนนต์ + messages ของตัวเอง
| งาน | ไฟล์ |
|---|---|
| F1 หน้าแรก/PWA | `src/app/page.tsx` · `src/components/f1/**` · `src/messages/f1.ts` · `public/manifest.webmanifest` · `public/sw.js` · `public/img/icon-*.png` และภาพประกอบ SVG ใหม่ `public/img/home-*.svg` |
| F2 หน้าโครงการ | `src/app/projects/[id]/**` · `src/components/f2/**` · `src/messages/f2.ts` |
| F3 ตั้งโครงการ/โครงการของฉัน | `src/app/my/projects/**` · `src/components/f3/**` · `src/messages/f3.ts` |
| F4 บริจาค/ใบเสร็จ | `src/app/donate/**` · `src/app/receipt/**` · `src/app/my/donations/**` · `src/components/f4/**` · `src/messages/f4.ts` |
| F5 สมาชิก | `src/app/{login,register,kyc,account,notifications}/**` · `src/components/f5/**` · `src/messages/f5.ts` |
| F6 ผู้รับรอง/อาสา/ยืม | `src/app/{voucher,volunteer,loans,pledges}/**` · `src/components/f6/**` · `src/messages/f6.ts` |
| F7 หลังบ้านเจ้าหน้าที่ | `src/app/staff/**` (หน้า ไม่ใช่ `api/`) · `src/components/f7/**` · `src/messages/f7.ts` |
| F8 การเงิน/ผู้บริหาร | `src/app/{finance,exec}/**` · `src/components/f8/**` · `src/messages/f8.ts` |

หมายเหตุ F7: โฟลเดอร์ `src/app/staff/` เป็นของ F7 ส่วน `src/app/api/staff/**` เป็นของงาน API ตามตารางด้านบน — ไม่ปะปนกัน

ข้อความไทยฝั่ง API (error message ฯลฯ) เขียนใน `src/messages/a1..a5.ts` ของงานนั้น แล้ว import มาใช้ใน route/lib
