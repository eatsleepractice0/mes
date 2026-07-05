# mes-web

Qcadoo MES 公司架构模块 — React 前端。

## 技术栈

- React 18 + TypeScript + Vite
- Ant Design 5
- TanStack Router
- ahooks + fetch

## 环境要求

- Node.js 20+
- pnpm

## 快速开始

```bash
pnpm install
cp .env.example .env
pnpm dev
```

前端默认运行在 `http://localhost:5173`，API 请求通过 Vite proxy 转发到 `http://localhost:3001`。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API 地址（开发留空走 proxy） | `http://localhost:3001` |

## 联调

先启动后端 `mes-api`（端口 3001），再启动本前端项目：

```bash
# 终端 1
cd ../mes-api && pnpm dev

# 终端 2
cd mes-web && pnpm dev
```

## 路由

| 路径 | 模块 |
|------|------|
| `/company-structure/factories` | 工厂信息 |
| `/company-structure/divisions` | 生产部门 |
| `/company-structure/production-lines` | 生产线 |
| `/company-structure/workstation-types` | 工作站类型 |
| `/company-structure/workstations` | 工作站 |
| `/company-structure/subassemblies` | 部件信息 |

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发模式 |
| `pnpm build` | 生产构建 |
| `pnpm preview` | 预览构建产物 |
