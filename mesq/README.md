# mesq — Qcadoo MES 现代化子项目

本目录包含从 Qcadoo MES 迁移的独立前后端项目，规格见原仓库 `spec/spec.md`。

## 目录结构

```
mesq/
├── mes-api/     # Express + Drizzle 后端（端口 3001）
└── mes-web/     # React + Vite 前端（端口 5173）
```

## 本地路径

建议放置于：

```
D:\Dev\mesq\
├── mes-api\
└── mes-web\
```

## 快速开始

### 1. 后端

```bash
cd mes-api
pnpm install
cp .env.example .env
# 编辑 .env 配置 DATABASE_URL
pnpm dev
```

### 2. 前端

```bash
cd mes-web
pnpm install
cp .env.example .env
pnpm dev
```

浏览器访问 http://localhost:5173

## 验收

- 后端: `curl http://localhost:3001/api/v1/health`
- 前端: 侧边栏显示「公司架构」及 6 个子菜单
