# mes-api

Qcadoo MES 公司架构模块 — Express 后端 API。

## 技术栈

- Express 4 + TypeScript
- Drizzle ORM + PostgreSQL
- zod 参数校验

## 环境要求

- Node.js 20+
- pnpm
- PostgreSQL（复用现有 MES 数据库）

## 快速开始

```bash
pnpm install
cp .env.example .env
# 编辑 .env 填写 DATABASE_URL
pnpm dev
```

服务默认运行在 `http://localhost:3001`。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 服务端口 | `3001` |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@localhost:5432/mes` |
| `CORS_ORIGIN` | 允许跨域的前端地址 | `http://localhost:5173` |

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/health` | 健康检查 |

## 数据库 Schema

从现有数据库反向生成 Drizzle schema：

```bash
pnpm db:introspect
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发模式（热重载） |
| `pnpm build` | 编译 TypeScript |
| `pnpm start` | 运行编译产物 |
| `pnpm db:introspect` | 从数据库生成 schema |
