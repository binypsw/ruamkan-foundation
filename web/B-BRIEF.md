# B-BRIEF · คำสั่งร่วมของทุกงานในช่วง B

คุณเป็น subagent หนึ่งในทีม 13 ตัว (A1–A5 API · F1–F8 หน้าเว็บ) ที่สร้างเว็บ "ร่วมกันทำไม" (Next.js 14 App Router + TypeScript + PostgreSQL ด้วย `pg` ตรง ๆ ไม่ใช้ ORM) พร้อมกัน ทุกตัวทำงานในโฟลเดอร์ `web/` เดียวกัน

## อ่านก่อนเริ่ม (ตามลำดับ)
1. `web/API-CONTRACT.md` (สัญญากลาง — API ทุกเส้น · ข้อตกลง · โมเดลสถานะ) และ `web/OWNERSHIP.md` (ไฟล์ของคุณ)
2. `REQUIREMENTS.md` (FR/BR/NFR) · `TEST-DATA.md` (seed + ค่าขอบ E01–E72) · `DESIGN.md` · `USER-STORIES.md` (อยู่ที่โฟลเดอร์แม่ของ `web/`)
3. `db/init/01-schema.sql` (ตารางจริง) · `db/init/02-seed.sql` (ข้อมูลตั้งต้น)
4. ไฟล์กลางที่ต้อง import: `src/lib/{db,clock,decimal,http,auth,ledger,audit,notify,privacy,testid,format}.ts` · `src/lib/rules/dates.ts` · `src/components/ui/index.tsx` · `src/lib/client/api.ts` · `src/app/globals.css`

## กฎเหล็ก
- แก้/สร้างได้เฉพาะไฟล์ที่เป็นของคุณตาม `OWNERSHIP.md` · **ห้ามแก้ไฟล์กลาง ห้ามแก้ไฟล์ของงานอื่น ห้ามแก้ `db/`** · ถ้าสัญญาขาด/ขัดกัน ให้ตัดสินใจแบบที่เข้ากับสัญญามากที่สุด แล้วจดใน `web/CONTRACT-NOTES/<ชื่องาน>.md` (สั้น ๆ: ขาดอะไร · คุณทำอย่างไร)
- **ห้ามรัน docker · ห้ามเปิด dev server (`next dev`/`next start`) · ห้ามรัน `next build`** (ทีมอื่นทำงานพร้อมกัน พอร์ตและโฟลเดอร์ `.next` จะชนกัน) · ห้ามทำ BUG_MODE · ห้ามเขียนข้อความที่บอกใบ้ว่ามีบั๊กตั้งใจ
- ตรวจงานด้วย `npx tsc --noEmit --incremental false` (ในโฟลเดอร์ `web/`) และ `npx vitest run src/lib/<ไฟล์ของคุณ>` เท่านั้น · error จากไฟล์ของงานอื่นที่ยังเขียนไม่เสร็จให้ข้าม แต่ไฟล์ของคุณต้อง compile ผ่าน · ฝั่ง API อ่านฐานข้อมูลจริงได้ด้วยสคริปต์ node + `pg` ที่ `postgres://ruamkan:ruamkan_dev_pw@localhost:5433/ruamkan` แบบ **SELECT อย่างเดียว** (ห้ามเขียน/ลบข้อมูล ห้าม TRUNCATE) เพื่อเช็กข้อมูล seed
- กฎของร้าน BR-01..36 อยู่ใน `lib/rules/*` และถูกเรียกจาก API ทุกเส้น · **ห้ามเชื่อค่าที่เบราว์เซอร์ส่งมา** · เงินคิดด้วยจำนวนเต็มสตางค์ (`lib/decimal.ts`) ห้าม float · ปัดครึ่งขึ้น 2 ตำแหน่ง · เวลาเรียก `now()` จาก `lib/clock` เท่านั้น (ห้าม `Date.now()`/`new Date()` ไม่มีอาร์กิวเมนต์ ในโค้ดกฎ/API/หน้าเว็บ; `new Date(ค่า)` แปลงค่าที่มีอยู่แล้วทำได้)
- SQL เขียนตรง ๆ ด้วย parameter (`$1`) เสมอ · เงินใน JSON เป็นสตริง `"1000.00"` · ใช้ `tx()` + `FOR UPDATE` ตามที่สัญญาระบุเพื่อกันชนกัน
- เงินเข้า/ออก wallet ผ่าน `lib/ledger.ts` เท่านั้น · เขียน `audit()` ทุกการอนุมัติ/ระงับ/ปลดล็อก · API สาธารณะห้ามส่ง `*_enc`/เลขบัตร/ที่อยู่ละเอียด/ประวัติรักษา
- API route ใช้ `route({...}, handler)` จาก `lib/http.ts` และ `export const dynamic = 'force-dynamic'` ทุกไฟล์ `route.ts` · Next 14: พารามิเตอร์พาธอยู่ที่ `ctx.params` (ไม่ต้อง await) · โฟลเดอร์ไดนามิกชื่อ `[id]` เป็นต้น
- error ตอบเป็นไทย ข้อความตรงกับตารางใน `API-CONTRACT.md` คำต่อคำ (หัวหน้าจะเอาไปเขียนใน SPEC.md)

## เฉพาะงานหน้าเว็บ (F1–F8)
- หน้าเว็บเป็นภาษาไทยอย่างเดียว ข้อความทั้งหมดเก็บใน `src/messages/<fN>.ts` ของคุณ · ใช้ `'use client'` เมื่อต้องโต้ตอบ · เรียก API ผ่าน `api()` จาก `lib/client/api.ts` (คืน `{ok,status,data,error}` ไม่ throw) · ผู้ใช้ปัจจุบันด้วย `useMe()` · "วันนี้" ด้วย `useNow()` หรือ `now` ที่ API ส่งมา
- ตัวอักษรหลัก ≥ 16px · คอนทราสต์ผ่าน WCAG AA (ใช้ตัวแปรสีใน `globals.css`) · ปุ่มสูง ≥ 44px · ใช้งานได้บน 375px กว้างโดยไม่เลื่อนข้าง (ตาราง ใส่ `.table-wrap`; ปุ่มในแถว `.row` ให้ wrap) · ไม่ใช้รูปถ่ายหรือรูปจากอินเทอร์เน็ต/รูปคนจริง ใช้ `<Illustration>` และ SVG ที่เขียนเอง · เคารพ `prefers-reduced-motion` (ใช้ transition ใน globals.css)
- ใช้คอมโพเนนต์ `components/ui` (Button, LinkButton, Card, Badge, Alert, ProgressBar/ProgressSet, TextField, TextArea, SelectField, CheckField, PageTitle, Empty, Illustration) แทนการสร้างสไตล์ใหม่ · ถ้าต้องการสไตล์เพิ่ม ให้ใช้ `style={{}}` หรือ `<style jsx>`-ไม่ได้ ให้ใช้คลาสใน globals.css ที่มี + inline style เล็กน้อย
- **data-testid ทุกปุ่ม ช่องกรอก ลิงก์ ผลลัพธ์ และข้อความ error** (กติกาใน `lib/testid.ts`: `<หน้า>-<องค์ประกอบ>[-<รหัส>]` เช่น `donate-amount-input`, `donate-submit`, `login-error`) · ทุกตัวมี accessible name (label/ข้อความ/aria-label) เพื่อหาด้วย role+name ได้ · ผลลัพธ์ตัวเลขที่ตรวจได้ (ยอดจ่ายรวม ยอดพัก) ให้มี testid ของตัวเลข
- หน้าที่ต้องล็อกอิน: `useMe()` ได้ `null` → แสดงข้อความ + ลิงก์ `/login?next=<path>` · แสดง `error.message` จาก API ตรง ๆ ใน `<Alert kind="error" testid="…-error">`
- ห้ามสร้าง `layout.tsx` ใหม่ที่ซ้อน header/footer (มีใน root layout แล้ว) · ใช้ `<PageTitle>` ขึ้นต้นหน้า
- ตอนเสร็จ: สรุปรายการ data-testid ทั้งหมดของคุณไว้ในไฟล์ `web/CONTRACT-NOTES/<fN>-testids.md` (ตารางสั้น: testid | อยู่ที่ไหน)

## เฉพาะงาน API (A1–A5)
- ทุก endpoint ในตารางของคุณใน `API-CONTRACT.md` ต้องมี · ทำตามสถานะ code/ข้อความ error/รหัส `BR_xx_…` ที่ระบุ · ค่าขอบทุกตัวที่เกี่ยวข้องกับ BR ของคุณใน `TEST-DATA.md` ต้องให้ผลตรงตาราง (รวมข้อมูล seed ที่ผู้ใช้ U01–U14 / โครงการ P01–P10 ระบุ)
- เขียนกฎเป็นฟังก์ชัน pure ใน `lib/rules/<ของคุณ>.ts` แล้วเรียกจาก route (ให้ทดสอบ unit ได้) · เขียน vitest ครอบคลุมค่าขอบของงานคุณ (ถ้าไฟล์ test อยู่ใต้ไฟล์ที่คุณเป็นเจ้าของ)
- ตอนเสร็จ: สรุปสั้น ๆ ท้ายคำตอบ: endpoint ที่ทำครบ · ที่ทำไม่ได้/เบี่ยงจากสัญญา (และจดใน CONTRACT-NOTES แล้ว)
