# Spec: 公司架构模块 — React + Express 迁移

> **版本**: 1.0.0  
> **状态**: Draft  
> **范围**: 公司架构（Company Structure）菜单下 6 个子模块  
> **基线代码**: Qcadoo MES 2.5.15 (`57d7995`)

---

## 1. 背景与目标

### 1.1 背景

现有系统为 Java/Qcadoo MES 单体应用，前端基于 Qcadoo View（XML + jQuery），后端基于 Spring MVC + Qcadoo 平台 ORM。公司架构模块涵盖工厂、部门、生产线、工作站类型、工作站、部件等主数据管理。

### 1.2 目标

将「公司架构」菜单下的功能模块逐步迁移为 **React 18 + Express** 现代 Web 应用，**复用现有 PostgreSQL 数据库表结构**，实现等价的 CRUD 与列表管理能力。

### 1.3 非目标（本期不做）

| 排除项 | 说明 |
|--------|------|
| 权限控制 | 不实现 `ROLE_COMPANY_STRUCTURE` 等角色鉴权 |
| 多语言 | 界面固定中文，不接入 i18n |
| 外键约束校验 | 关联字段仅存 ID，不做数据库级 FK 验证 |
| 级联删除 | 不实现原 Java Hooks 的级联/阻止删除逻辑 |
| 乐观锁 | 不读写 `entityversion` 字段 |
| 附件上传 | 工作站/部件附件本期不做 |
| Excel 导入 | 工作站批量导入本期不做 |
| 工厂结构树 | `productionlines_factorystructureelement` 本期不做 |
| 状态机 | 工作站启动/停止仅做字段切换，不做完整状态机 |
| 原 Java 系统下线 | 新旧系统可并行读写同一数据库 |

---

## 2. 技术栈

### 2.1 前端 `mes-web`

| 类别 | 选型 | 版本 |
|------|------|------|
| 框架 | React | 18 |
| 语言 | TypeScript | 8 |
| 构建 | Vite | 8 |
| UI 组件库 | Ant Design | 5 |
| 路由 | TanStack Router | latest |
| HTTP | 原生 fetch（封装统一 client） | — |
| Hooks 工具 | ahooks | 3 |

### 2.2 后端 `mes-api`

| 类别 | 选型 | 版本 |
|------|------|------|
| 框架 | Express | 4 |
| 语言 | TypeScript | 8 |
| ORM | Drizzle ORM | latest |
| 数据库驱动 | pg | 8 |
| 参数校验 | zod | 3 |

### 2.3 基础设施

| 类别 | 选型 |
|------|------|
| 仓库策略 | **前后端独立项目**，不使用 monorepo |
| 包管理 | 各项目独立管理（`mes-api`、`mes-web` 各自 `package.json`） |
| 数据库 | 现有 PostgreSQL（demo_db 或生产库） |
| 开发通信 | 前端 Vite proxy `/api` → `http://localhost:3001` |
| 生产通信 | 前端 `VITE_API_BASE_URL` 指向后端地址；后端开启 CORS |

---

## 3. 项目结构

前后端为**两个独立项目**，可放在同一父目录下并列管理，但各自拥有独立的依赖与构建流程。

```
projects/                    # 本地开发父目录（可选，非 monorepo）
├── mes-api/                 # 后端独立项目
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── .env.example
│   ├── README.md
│   └── src/
│       ├── index.ts
│       ├── db/
│       │   ├── index.ts
│       │   └── schema/
│       ├── routes/
│       ├── services/
│       ├── schemas/
│       └── middleware/
│
└── mes-web/                 # 前端独立项目
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── .env.example
    ├── README.md
    └── src/
        ├── routes/
        ├── api/
        ├── components/
        ├── hooks/
        └── types/
```

规格文档存放于原 MES 仓库：

```
mes/                         # 原 Java MES 仓库（基线参考 + 文档）
├── spec/
│   ├── spec.md
│   └── task.md
├── mes-plugins/
└── mes-application/
```

### 3.1 项目独立性说明

| 维度 | mes-api | mes-web |
|------|---------|---------|
| 依赖安装 | `cd mes-api && pnpm install` | `cd mes-web && pnpm install` |
| 开发启动 | `pnpm dev`（端口 3001） | `pnpm dev`（端口 5173） |
| 构建 | `pnpm build` → `dist/` | `pnpm build` → `dist/` |
| 环境变量 | `DATABASE_URL`, `PORT`, `CORS_ORIGIN` | `VITE_API_BASE_URL` |

> 类型定义在前端项目内维护，后端通过 zod schema 校验；**不共享 npm 包**，避免 monorepo 依赖。

---

## 4. 业务模块范围

### 4.1 菜单结构

```
公司架构
├── 工厂信息          /company-structure/factories
├── 生产部门          /company-structure/divisions
├── 生产线            /company-structure/production-lines
├── 工作站类型        /company-structure/workstation-types
├── 工作站            /company-structure/workstations
└── 部件信息          /company-structure/subassemblies
```

### 4.2 实体依赖关系

```mermaid
graph TD
    WT[工作站类型 basic_workstationtype] --> WS[工作站 basic_workstation]
    WT --> SA[部件 basic_subassembly]
    F[工厂 basic_factory] --> D[部门 basic_division]
    D --> PL[生产线 productionlines_productionline]
    D --> WS
    PL --> WS
    WS --> SA
    D -.M2M.-> PL
```

### 4.3 开发顺序

按依赖从少到多：**工作站类型 → 工厂 → 部门 → 生产线 → 工作站 → 部件**

---

## 5. 数据模型

> 字段以 `mes-application/src/main/resources/schema/demo_db_en.sql` 为准。  
> 蛇形命名列在 Drizzle/TS 中转为 camelCase。

### 5.1 工作站类型 `basic_workstationtype`

| 列名 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| id | bigint | ✓ | PK | 序列 `basic_workstationtype_id_seq` |
| number | varchar(255) | ✓ | ✓ | 编号 |
| name | varchar(1024) | ✓ | | 名称 |
| description | varchar(2048) | | | 描述 |
| subassembly | boolean | | | 是否部件类型 |
| active | boolean | | | 默认 true |

### 5.2 工厂 `basic_factory`

| 列名 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| id | bigint | ✓ | PK | 序列 `basic_factory_id_seq` |
| number | varchar(255) | ✓ | ✓ | 编号 |
| name | varchar(1024) | ✓ | | 名称 |
| city | varchar(255) | | | 城市 |
| active | boolean | | | 默认 true |

> `warehouse_id` 本期忽略。

### 5.3 生产部门 `basic_division`

| 列名 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| id | bigint | ✓ | PK | 序列 `basic_division_id_seq` |
| number | varchar(255) | ✓ | ✓ | 编号 |
| name | varchar(1024) | ✓ | | 名称 |
| factory_id | bigint | | | 所属工厂 |
| supervisor_id | bigint | | | 主管（本期仅存 ID，不做下拉） |
| comment | varchar(2048) | | | 备注 |
| active | boolean | | | 默认 true |

> 忽略：`componentslocation_id`、`productionflow`、`wastereceptionwarehouse_id` 等物料流字段。

### 5.4 生产线 `productionlines_productionline`

| 列名 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| id | bigint | ✓ | PK | 序列 `productionlines_productionline_id_seq` |
| number | varchar(255) | ✓ | ✓ | 编号 |
| name | varchar(2048) | ✓ | | 名称 |
| place | varchar(255) | | | 位置 |
| description | varchar(2048) | | | 描述 |
| production | boolean | | | 是否生产型，默认 false |
| active | boolean | | | 默认 true |

**多对多关联表** `jointable_division_productionline`:

| 列名 | 类型 | 说明 |
|------|------|------|
| division_id | bigint | 部门 ID |
| productionline_id | bigint | 生产线 ID |

### 5.5 工作站 `basic_workstation`

| 列名 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| id | bigint | ✓ | PK | 序列 `basic_workstation_id_seq` |
| number | varchar(255) | ✓ | ✓ | 编号 |
| name | varchar(1024) | ✓ | | 名称 |
| description | varchar(2048) | | | 描述 |
| workstationtype_id | bigint | ✓ | | 工作站类型 |
| division_id | bigint | | | 部门 |
| productionline_id | bigint | | | 生产线 |
| serialnumber | varchar(255) | | | 序列号 |
| series | varchar(255) | | | 系列 |
| producer | varchar(255) | | | 制造商 |
| productiondate | date | | | 生产日期 |
| state | varchar(255) | | | `01stopped` / `02launched` |
| buffer | boolean | | | 是否缓冲站 |
| active | boolean | | | 默认 true |

### 5.6 部件 `basic_subassembly`

| 列名 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| id | bigint | ✓ | PK | 序列 `basic_subassembly_id_seq` |
| number | varchar(255) | ✓ | ✓ | 编号 |
| name | varchar(1024) | ✓ | | 名称 |
| workstationtype_id | bigint | ✓ | | 工作站类型 |
| workstation_id | bigint | | | 所属工作站 |
| serialnumber | varchar(255) | | | 序列号 |
| series | varchar(255) | | | 系列 |
| producer | varchar(255) | | | 制造商 |
| productiondate | date | | | 生产日期 |
| lastrepairsdate | date | | | 最近维修日期 |
| type | varchar(255) | | | 部件类型字典值 |
| active | boolean | | | 默认 true |

---

## 6. API 设计

### 6.1 通用约定

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **分页参数**: `page`（从 1 开始）、`size`（默认 20）
- **搜索参数**: `search`（模糊匹配 number、name）
- **筛选参数**: `active`（`true` / `false`）
- **删除策略**: 软删除，设 `active = false`

### 6.2 统一响应格式

```typescript
// 列表
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

// 单条
interface ItemResponse<T> {
  data: T;
}

// 错误
interface ErrorResponse {
  message: string;
  code?: string;
}
```

### 6.3 端点清单

#### 工作站类型 `/workstation-types`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/workstation-types` | 列表（分页、搜索） |
| GET | `/workstation-types/:id` | 详情 |
| POST | `/workstation-types` | 创建 |
| PUT | `/workstation-types/:id` | 更新 |
| PATCH | `/workstation-types/:id/active` | 启用/停用 |
| DELETE | `/workstation-types/:id` | 软删除 |

#### 工厂 `/factories`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/factories` | 列表 |
| GET | `/factories/:id` | 详情 |
| POST | `/factories` | 创建 |
| PUT | `/factories/:id` | 更新 |
| PATCH | `/factories/:id/active` | 启用/停用 |
| DELETE | `/factories/:id` | 软删除 |

#### 部门 `/divisions`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/divisions` | 列表，支持 `factoryId` 筛选 |
| GET | `/divisions/:id` | 详情 |
| POST | `/divisions` | 创建 |
| PUT | `/divisions/:id` | 更新 |
| PATCH | `/divisions/:id/active` | 启用/停用 |
| DELETE | `/divisions/:id` | 软删除 |

#### 生产线 `/production-lines`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/production-lines` | 列表，支持 `divisionId` 筛选 |
| GET | `/production-lines/:id` | 详情（含 `divisionIds`） |
| POST | `/production-lines` | 创建（body 含 `divisionIds: number[]`） |
| PUT | `/production-lines/:id` | 更新（含 `divisionIds`） |
| PATCH | `/production-lines/:id/active` | 启用/停用 |
| DELETE | `/production-lines/:id` | 软删除 |

#### 工作站 `/workstations`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/workstations` | 列表，支持 `divisionId`、`productionLineId`、`workstationTypeId` 筛选 |
| GET | `/workstations/:id` | 详情 |
| POST | `/workstations` | 创建 |
| PUT | `/workstations/:id` | 更新 |
| PATCH | `/workstations/:id/state` | 切换状态 `{ state: "01stopped" \| "02launched" }` |
| PATCH | `/workstations/:id/active` | 启用/停用 |
| DELETE | `/workstations/:id` | 软删除 |

#### 部件 `/subassemblies`

| Method | Path | 说明 |
|--------|------|------|
| GET | `/subassemblies` | 列表，支持 `workstationId`、`workstationTypeId` 筛选 |
| GET | `/subassemblies/:id` | 详情 |
| POST | `/subassemblies` | 创建 |
| PUT | `/subassemblies/:id` | 更新 |
| PATCH | `/subassemblies/:id/active` | 启用/停用 |
| DELETE | `/subassemblies/:id` | 软删除 |

#### 健康检查

| Method | Path | 说明 |
|--------|------|------|
| GET | `/health` | 返回 `{ status: "ok" }` |

### 6.4 ID 生成

创建记录时使用 PostgreSQL 序列：

```sql
SELECT nextval('basic_factory_id_seq');
```

---

## 7. 前端设计

### 7.1 布局

- **侧边栏**: Ant Design `Layout.Sider`，展示「公司架构」及 6 个子菜单
- **顶栏**: 应用标题 + 面包屑（TanStack Router）
- **内容区**: 列表页或表单页

### 7.2 列表页（统一模式）

- Ant Design `Table` + ahooks `useAntdTable`
- 顶部：搜索框（`search`）+ 筛选（`active`）+ 新建按钮
- 列：业务字段 + 状态标签 + 操作列（编辑、启用/停用、删除）
- 分页：服务端分页

### 7.3 编辑（统一模式）

- Ant Design `Modal` 或 `Drawer` + `Form`
- ahooks `useRequest` 处理提交
- 关联字段：`Select` 下拉，数据来自对应列表 API（`active=true`，不分页或 `size=1000`）

### 7.4 级联筛选规则

| 页面 | 级联逻辑 |
|------|----------|
| 部门表单 | 工厂下拉 |
| 生产线表单 | 部门多选 |
| 工作站表单 | 选部门 → 过滤生产线下拉 |
| 工作站表单 | 工作站类型下拉 |
| 部件表单 | 工作站类型 → 过滤工作站下拉 |

### 7.5 fetch client

```typescript
// mes-web/src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? res.statusText);
  }
  return res.json();
}
```

---

## 8. 后端设计

### 8.1 分层

```
routes/     → 解析请求、调用 service、返回 JSON
services/   → 业务逻辑、Drizzle 查询
db/schema/  → Drizzle 表定义
middleware/ → 错误处理、CORS、请求日志
```

### 8.1.1 CORS 配置

前后端独立部署，后端需允许前端跨域：

```typescript
// mes-api/src/index.ts
import cors from 'cors';
app.use(cors({ origin: process.env.CORS_ORIGIN }));
```

### 8.2 Drizzle Schema 生成

1. 配置 `drizzle.config.ts` 连接现有数据库
2. 运行 `drizzle-kit introspect` 生成基础 schema
3. 手动裁剪为本期 6 张表 + 1 张 junction 表

### 8.3 通用 Service 模式

每个模块实现：

- `list(query)` — 分页 + 搜索 + 筛选
- `getById(id)` — 单条查询
- `create(input)` — `nextval` 取 ID + insert
- `update(id, input)` — update
- `setActive(id, active)` — 启用/停用
- `softDelete(id)` — `active = false`

### 8.4 关联查询

列表页 JOIN 显示关联名称（仅展示，不做 FK 校验）：

```sql
-- 示例：部门列表显示工厂名称
SELECT d.*, f.name AS factory_name
FROM basic_division d
LEFT JOIN basic_factory f ON d.factory_id = f.id
```

---

## 9. 环境配置

### 9.1 后端 `mes-api/.env`

```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/mes
CORS_ORIGIN=http://localhost:5173
```

### 9.2 前端 `mes-web/.env`

```env
# 开发环境留空，走 Vite proxy；生产环境填后端地址
VITE_API_BASE_URL=
```

### 9.3 前端 `mes-web/vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3001',
  },
}
```

### 9.4 本地开发启动

两个独立终端分别启动：

```bash
# 终端 1 — 后端
cd mes-api && pnpm install && pnpm dev

# 终端 2 — 前端
cd mes-web && pnpm install && pnpm dev
```

---

## 10. 验收标准

### 10.1 阶段 0（脚手架）

- [ ] `mes-api` 独立项目可 `pnpm install` + `pnpm dev` 启动
- [ ] `mes-web` 独立项目可 `pnpm install` + `pnpm dev` 启动
- [ ] `GET /api/v1/health` 返回 200
- [ ] 前端 Vite proxy 可访问后端 health 接口
- [ ] 前端展示侧边栏布局，6 个菜单可导航（页面可为空）

### 10.2 每模块通用验收

- [ ] 列表：分页、搜索、按 active 筛选
- [ ] 新建：必填校验、number 唯一性报错
- [ ] 编辑：回显数据、保存成功
- [ ] 启用/停用：状态切换生效
- [ ] 删除：软删除后列表不再显示（默认 active=true 筛选）
- [ ] 数据写入现有 PostgreSQL 表，原 Qcadoo 系统可读取

### 10.3 模块特有验收

| 模块 | 特有验收 |
|------|----------|
| 部门 | 工厂下拉可选，列表显示工厂名称 |
| 生产线 | 部门多选关联，junction 表正确写入 |
| 工作站 | 类型/部门/生产线下拉，状态可切换 |
| 部件 | 类型/工作站下拉，按工作站筛选列表 |

---

## 11. 风险与约束

| 风险 | 缓解措施 |
|------|----------|
| 新旧系统并行写库 | 先只读验证，按模块灰度切写 |
| Drizzle introspect 列名不一致 | 以 `demo_db_en.sql` 为最终准绳 |
| 字典值（place、type） | 第一期前端硬编码枚举 |
| number 唯一冲突 | API 层捕获 PG unique violation 返回 409 |
| 大数据量列表 | 服务端分页，默认 size=20 |

---

## 12. 参考

| 资源 | 路径 |
|------|------|
| 原菜单定义 | `mes-plugins/mes-plugins-basic/src/main/resources/qcadoo-plugin.xml` |
| 原模型定义 | `mes-plugins/mes-plugins-basic/src/main/resources/basic/model/` |
| 原视图定义 | `mes-plugins/mes-plugins-basic/src/main/resources/basic/view/` |
| 数据库 Schema | `mes-application/src/main/resources/schema/demo_db_en.sql` |
| 生产线模型 | `mes-plugins/mes-plugins-production-lines/src/main/resources/productionLines/model/` |
