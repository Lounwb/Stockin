# Stockin 手机库存管理应用

## 简介

**Stockin** 是一个面向手机浏览器的轻量库存管理 Web 应用，用于统计和管理日常物品库存。支持：

- **库存管理**：录入物品名称、规格、物品图片、数量、单位等
- **扫码录入**：通过手机摄像头扫描条形码自动填入
- **图片上传**：拍照或从相册选择物品图片上传到云端
- **价格追踪**：为物品绑定京东 / 天猫 / 拼多多商品，每天自动抓取价格，展示价格曲线与最高/最低/近一年均价
- **用户体系**：支持匿名进入（无需注册）或邮箱登录链接，多设备同步

前端针对手机设备做了移动优先设计，适合放在桌面快捷方式当作“小程序”使用。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + React Router
- **UI**：Tailwind CSS + Recharts（价格曲线）
- **后端（BaaS）**：Supabase
  - Auth（邮箱魔法链接 + 匿名登录）
  - Postgres（`profiles / items / item_price_history / item_transactions`）
  - Storage（`item-images` 存储物品图片）
  - Edge Functions（`search_product / fetch_prices / get_price_stats`）
  - Cron（定时调用 `fetch_prices`）
- **部署**：前端部署在 Vercel，后端完全由 Supabase 提供

---

## 本地开发步骤

### 1. 克隆与安装依赖

```bash
pnpm install
# 或
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

在 `.env` 中填写：

- `VITE_SUPABASE_URL`：Supabase 项目地址（如 `https://xxx.supabase.co`）
- `VITE_SUPABASE_ANON_KEY`：Supabase 匿名公钥

### 3. 配置 Supabase 认证（Auth）

- 在 **Authentication → Providers → Email** 中启用 Email，并视需要设置：
  - **Confirm email**：若关闭，用户注册后可直接用账号密码登录；若开启，需先到邮箱点击确认链接后才能用密码登录（否则会提示 Invalid login credentials）。

### 4. 配置 Supabase 数据库 & Storage

1. 在 Supabase Dashboard 的 SQL 编辑器中执行 `supabase/schema.sql`  
   - 创建表：`profiles / items / item_price_history / item_transactions`
   - 配置 RLS 策略  
   - 创建库存数量变更 RPC：`change_item_quantity`
2. 在 Storage 中创建存储桶 **`item-images`**
   - 可根据需要设置为 public（或使用签名 URL）

### 5. 配置 Edge Functions 环境变量

在 Supabase 项目中为 Edge Functions 设置：

- `SUPABASE_URL`：当前 Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY`：Service Role Key（仅用于 Edge Functions，不暴露到前端）

**价格抓取（本分支不依赖外部 API）：**

- `fetch_prices` 已内置京东价格抓取（`p.3.cn`），无需配置 `PRICE_SERVICE_URL`。每日 Cron 会为已绑定京东 SKU 的物品写入当日价格；天猫/拼多多可在 `supabase/functions/fetch_prices/index.ts` 内扩展自建抓取逻辑。
- 商品搜索（`search_product`）若需京东/天猫/拼多多关键词搜索，可自建服务并配置 `PRICE_SERVICE_URL`（见 README 自建价格与搜索说明）；不配置时搜索返回空。

### 6. 启用 Edge Functions 与定时任务

1. 在 Supabase CLI 或 Dashboard 中部署函数：
   - `barcode_lookup`（扫码查商品，需关闭 JWT 校验以便未登录也可调用，见下方）
   - `search_product`
   - `fetch_prices`（内置京东抓价，每日自动执行）
   - `get_price_stats`（物品详情页价格曲线与最高/最低/近一年均价）
   - **条形码 401**：若前端调用 `barcode_lookup` 报 401，请用 CLI 部署以应用 `supabase/config.toml` 中的 `verify_jwt = false`：
     ```bash
     supabase functions deploy barcode_lookup
     ```
     或单独关闭校验：`supabase functions deploy barcode_lookup --no-verify-jwt`
2. 在 Supabase Dashboard 的 **Edge Functions → Scheduled** 中：
   - 为 `fetch_prices` 创建 **Daily Cron**（例如 `0 2 * * *` 每天 2:00 执行），实现每天自动获取商品价格并写入 `item_price_history`

### 7. 启动本地开发服务器

```bash
pnpm dev
# 或
npm run dev
```

浏览器打开 `http://localhost:5173`，使用手机号登录后即可开始录入和管理库存。

---

## Vercel 部署步骤清单

### 1. 新建 Vercel 项目

- 在 Vercel 中 **Import Project**，选中本仓库
- Build 命令：`vite build`（或 `npm run build`）
- Output 目录：`dist`

### 2. 配置 Vercel 环境变量

在 Vercel 项目的 **Environment Variables** 中配置：

- `VITE_SUPABASE_URL`：Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY`：Supabase 匿名公钥

> 注意：前端只需要匿名 Key，其余 Service Key 只在 Supabase Edge Functions 中使用。

### 3. 线上开放匿名使用

若希望线上用户无需注册即可使用，请在 **Supabase 控制台** 中：

1. 打开 **Authentication → Providers**
2. 找到 **Anonymous sign-ins（匿名登录）** 并 **启用**
3. 保存后，访问部署好的站点，点击「匿名进入（推荐先体验）」即可直接进入库存，无需邮箱

匿名用户数据仍按 `auth.uid()` 隔离，仅当前设备可见；后续可用邮箱登录以多设备同步。

### 4. 设置路由与域名

- 使用 Vite 默认静态导出，Vercel 会自动识别为前端 SPA
- 可以绑定自定义域名（可选），手机上添加到主屏幕便于访问

### 5. 验证线上功能

部署完成后，依次验证：

1. **匿名进入**：点击「匿名进入」应直接进入库存列表（需在 Supabase 开启 Anonymous sign-ins）
2. 邮箱登录：发送登录链接后，在电脑或手机浏览器点击邮件链接完成登录
3. 物品新增 / 编辑 / 删除 / 数量增减
4. 图片上传：拍照/相册是否能成功上传并显示
5. 条形码扫码：手机浏览器是否允许摄像头权限，扫码后条码是否自动填入
6. 商品自动匹配：是否能拉回京东/天猫/拼多多的候选列表并保存 SKU
7. 价格曲线：在 `fetch_prices` 定时任务运行后，是否能看到历史价格和统计信息

---

## 目录结构简要说明

- `src/main.tsx`：应用入口，挂载 React 与路由
- `src/App.tsx`：顶层路由结构 + 鉴权保护
- `src/contexts/AuthContext.tsx`：Supabase Auth 封装（手机号登录会话）
- `src/routes/AuthPage.tsx`：登录页（匿名进入 / 邮箱登录链接）
- `src/routes/ItemsListPage.tsx`：库存列表页
- `src/routes/ItemFormPage.tsx`：新建/编辑物品页面（含扫码、图片上传、电商匹配）
- `src/routes/ItemDetailPage.tsx`：物品详情 + 价格曲线
- `src/components/BarcodeScanner.tsx`：条形码扫描组件（基于 `@zxing/browser`）
- `src/components/ImageUploader.tsx`：图片上传组件（Supabase Storage）
- `src/components/PriceChart.tsx`：价格折线图与统计信息
- `src/api/items.ts`：物品相关 Supabase 调用封装
- `src/api/prices.ts`：价格匹配与价格统计 Edge Functions 调用封装
- `supabase/schema.sql`：数据库 Schema 与 RLS、RPC 定义
- `supabase/functions/*`：三个 Edge Functions 的实现

如需扩展（例如新增平台或增加更多统计指标），可以在保持现有接口结构的基础上逐步演进。  

