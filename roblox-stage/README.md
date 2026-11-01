# Roblox Stage (ระบบเวทีรับคิวจากไลฟ์)

โครงสร้างเกม Roblox Studio ที่ซิงก์ด้วย Rojo ตั้งค่าทีหลังได้ทั้งหมดใน `src/server/Config.luau`

## การติดตั้งใน Roblox Studio (ไม่ต้องใช้ Rojo)
1. เปิด Roblox Studio สร้างหรือเปิดเกมของคุณ
2. ใน **ServerScriptService** สร้าง **Folder** ชื่อ `Stage`
3. สร้างสคริปต์ในโฟลเดอร์ `Stage` ตามนี้ แล้ววางโค้ดจากไฟล์ใน `src/server/` ชื่อเดียวกัน:

| ชื่อใน Studio | ชนิด | ไฟล์ |
|---|---|---|
| `Config` | ModuleScript | `Config.luau` |
| `GiftQueue` | ModuleScript | `GiftQueue.luau` |
| `Effects` | ModuleScript | `Effects.luau` |
| `StageActor` | ModuleScript | `StageActor.luau` |
| `StageAPI` | ModuleScript | `StageAPI.luau` |
| `Main` | Script | `Main.server.luau` |
| `Bridge` | Script | `Bridge.server.luau` |
| `DevCommands` | Script | `DevCommands.server.luau` |

4. ปรับ `StageOrigin` ใน `Config` ให้ตรงกับตำแหน่งเวทีในแมปของคุณ
5. กด Play แล้วพิมพ์ในแชท: `/join <ชื่อRoblox>` และ `/gift Rose`
6. (ภายหลัง ตอนต่อ TikTok) เปิด Game Settings > Security > Allow HTTP Requests

ถ้าต้องการซิงก์ไฟล์อัตโนมัติ ใช้ Rojo ได้: รัน `rojo serve` ในโฟลเดอร์นี้แล้วกด Connect ในปลั๊กอิน Rojo

## ค่าเริ่มต้นที่เสนอ
| รายการ | ค่า | เหตุผล |
|---|---|---|
| อยู่บนเวทีพื้นฐาน | 20 วินาที | ท่าเต้นสั้น ๆ ประมาณ 8–15 วิ เพิ่มอีกนิดให้คนเห็นเอฟเฟกต์ |
| ของขวัญเพิ่มเวลา | +5 วิ ต่อชิ้น | ให้ของขวัญมีความหมายแต่ไม่ทำให้คิวค้าง |
| เวลาสูงสุดต่อคน | 45 วิ | ป้องกันคนเดียวยึดเวทีนานเกินไป |
| ช่องบนเวทีพร้อมกัน | 3 คน | ให้คนรอคิวเห็นว่าใกล้ถึงตาเมื่อไร |
| คิวสูงสุด | 15 รายการ | ป้องกันคิวยาวจนคนรอเกินไป |

## ไทม์ไลน์การพัฒนา
- [x] **ระยะ 1: โครงสร้างและคิว** (ตอนนี้) คิว FIFO, ตัวจัดการเวที, คำสั่งทดสอบในแชท
- [x] **ระยะ 2: อวาตาร์ NPC** สร้างตัวละครจากชื่อ Roblox และลบเมื่อหมดเวลา
- [x] **ระยะ 3: เอฟเฟกต์พื้นฐาน** Confetti, Fire, Stars (ต้องเพิ่มเอฟเฟกต์ตามของขวัญจริง)
- [x] **ระยะ 4: ตัวกลาง TikTok** (`bridge/`) อ่านแชท/ของขวัญ ตรวจชื่อ Roblox กันสแปม (เขียนและทดสอบหน่วยแล้ว แต่ยังไม่ได้ลองกับไลฟ์จริง)
- [x] **ระยะ 5: เชื่อมเซิร์ฟเวอร์** ส่งเข้าเกมด้วย Open Cloud MessagingService (`Bridge.server.luau`) ยังไม่ได้ทดสอบกับเกมที่เผยแพร่จริง
- [ ] **ระยะ 6: ท่าเต้นและแอนิเมชันจริง** ใส่ Animation ID แทนการโยกตัวแบบชั่วคราว
- [ ] **ระยะ 7: ตั้งค่าของขวัญจริง** แมปชื่อของขวัญ TikTok กับเอฟเฟกต์ใน Config

## สิ่งที่ต้องทำเพิ่มก่อนใช้งานจริง
- ตรวจสอบว่าเกมอนุญาตให้ดึงอวาตาร์ของผู้ใช้ได้ (ผู้ใช้บางคนตั้งค่าความเป็นส่วนตัว)
- ทดสอบความเร็วของคิวเมื่อของขวัญเข้ามาพร้อมกันจำนวนมาก

## ตัวกลาง TikTok (`bridge/`)
1. ติดตั้ง Node.js 20+ แล้วรัน `cd bridge && npm install`
2. คัดลอก `.env.example` เป็น `.env` แล้วกรอก: ชื่อ TikTok ที่กำลังไลฟ์, Universe ID ของเกม, Open Cloud API key
3. สร้าง API key ที่ https://create.roblox.com/dashboard/credentials เปิดสิทธิ์ **Messaging Service: Publish** ให้ experience ของคุณ
4. ทดสอบโดยไม่ส่งเข้าเกม: `node --env-file=.env src/index.js --dry-run` (ต้องกำลังไลฟ์อยู่)
5. ใช้งานจริง: `node --env-file=.env src/index.js`
6. เกมต้อง **เผยแพร่ (Publish)** แล้ว และต้องมีเซิร์ฟเวอร์ที่เปิดอยู่ เพราะ MessagingService ส่งเข้าเซิร์ฟเวอร์สดเท่านั้น

กติกาที่ตัวกลางใช้: คนดูพิมพ์ชื่อ Roblox ตรง ๆ หรือ `!join ชื่อ` ในแชท, ตรวจว่ามีชื่อนี้จริงผ่าน Roblox API, จำกัด 1 ครั้งต่อคนต่อ 60 วินาที, ของขวัญแบบกดรัวนับเมื่อจบสตรีค และจำกัดสูงสุด 5 ครั้งต่อชุด

รันเทสต์: `cd bridge && npm test`
