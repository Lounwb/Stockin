# Stockin 手机库存管理应用

## 简介

**Stockin** 是一个面向手机浏览器的轻量库存管理 Web 应用，用于统计和管理日常物品库存。支持：

- **库存管理**：录入物品名称、规格、物品图片、数量、单位等
- **扫码录入**：通过手机摄像头扫描条形码自动填入
- **图片上传**：拍照或从相册选择物品图片上传到云端
- **价格追踪**：为物品绑定京东 / 天猫 / 拼多多商品，每天自动抓取价格，展示价格曲线与最高/最低/近一年均价
- **用户体系**：使用手机号 + 短信验证码登录，无需密码

前端针对手机设备做了移动优先设计，适合放在桌面快捷方式当作“小程序”使用。

## 技术栈

- **前端**：React 18 + TypeScript + Vite + React Router
- **UI**：Tailwind CSS + Recharts（价格曲线）
- **后端（BaaS）**：Supabase
  - Auth（手机号 OTP 登录）
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

### 3. 配置 Supabase 数据库 & Storage

1. 在 Supabase Dashboard 的 SQL 编辑器中执行 `supabase/schema.sql`  
   - 创建表：`profiles / items / item_price_history / item_transactions`
   - 配置 RLS 策略  
   - 创建库存数量变更 RPC：`change_item_quantity`
2. 在 Storage 中创建存储桶 **`item-images`**
   - 可根据需要设置为 public（或使用签名 URL）

### 4. 配置 Edge Functions 环境变量

在 Supabase 项目中为 Edge Functions 设置：

- `SUPABASE_URL`：当前 Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY`：Service Role Key（仅用于 Edge Functions，不暴露到前端）
- `PRICE_SERVICE_URL`：外部价格服务地址（你自建或第三方）
- `PRICE_SERVICE_API_KEY`（可选）：价格服务鉴权用

> `PRICE_SERVICE_URL` 应提供两个接口：
> - `POST /search`：根据 `platform + name/barcode` 返回候选商品列表
> - `POST /current_prices`：根据 `platform + sku` 批量返回当前价格

### 5. 启用 Edge Functions 与定时任务

1. 在 Supabase CLI 或 Dashboard 中部署函数：
   - `search_product`
   - `fetch_prices`
   - `get_price_stats`
2. 在 Supabase Dashboard 的 **Edge Functions → Scheduled** 中：
   - 为 `fetch_prices` 创建 **Daily Cron**（例如 `0 2 * * *` 每天 2:00 执行），实现“每天自动获取价格”

### 6. 启动本地开发服务器

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

### 3. 设置路由与域名

- 使用 Vite 默认静态导出，Vercel 会自动识别为前端 SPA
- 可以绑定自定义域名（可选），手机上添加到主屏幕便于访问

### 4. 验证线上功能

部署完成后，依次验证：

1. 手机号登录：是否能正常收到短信并登录
2. 物品新增 / 编辑 / 删除 / 数量增减
3. 图片上传：拍照/相册是否能成功上传并显示
4. 条形码扫码：手机浏览器是否允许摄像头权限，扫码后条码是否自动填入
5. 商品自动匹配：是否能拉回京东/天猫/拼多多的候选列表并保存 SKU
6. 价格曲线：在 `fetch_prices` 定时任务运行后，是否能看到历史价格和统计信息

---

## 目录结构简要说明

- `src/main.tsx`：应用入口，挂载 React 与路由
- `src/App.tsx`：顶层路由结构 + 鉴权保护
- `src/contexts/AuthContext.tsx`：Supabase Auth 封装（手机号登录会话）
- `src/routes/AuthPage.tsx`：手机号 + 验证码登录页面
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

