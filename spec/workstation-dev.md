# 工作站模块开发规划（列表 + 新增）

> **状态**: 规划中  
> **范围**: 仅「列表展示全部数据」与「新增」  
> **前端路由**: `/company-structure/workstations`  
> **表**: `basic_workstation`  
> **基线**: 原 Qcadoo MES 模型/视图 + `spec/spec.md` 约定  
> **API 风格**: 仅使用 GET / POST（与既有模块约定一致）

---

## 1. 目标与非目标

### 1.1 本期目标

| 功能 | 说明 |
|------|------|
| 列表 | 展示工作站全部记录（分页拉取），列含关联名称 |
| 新增 | Modal/Drawer 表单创建一条工作站，写入 `basic_workstation` |

### 1.2 本期不做

| 排除项 | 说明 |
|--------|------|
| 编辑 / 详情回显 | 不做更新接口与编辑表单 |
| 启用/停用、软删除 | 不做 `active` 切换与 delete |
| 启动/停止状态切换 | 不做 `state` 变更接口 |
| 附件、导入、工厂结构树 | 原系统能力本期忽略 |
| 员工 staff、尺寸字段 | 列表/表单不暴露 |
| 权限 / i18n | 同总 spec |

---

## 2. 依据的现有代码

| 资源 | 路径 | 用途 |
|------|------|------|
| 模型 | `mes-plugins/.../basic/model/workstation.xml` | 字段、必填、`workstationType` 必填、`division` 可选 |
| 列表视图 | `mes-plugins/.../basic/view/workstationsList.xml` | 列表列：编号、名称、类型、部门、状态等 |
| 详情视图 | `mes-plugins/.../basic/view/workstationDetails.xml` | 新建表单字段参考 |
| 生产线扩展 | `mes-plugins/.../productionLines/view/tabExtensions/workstationDetails.xml` | 部门 → 生产线级联（`source="#{division}.productionLines"`） |
| 插件扩展 | `mes-plugins/.../productionLines/.../qcadoo-plugin.xml` | 给 workstation 增加 `productionLine` belongsTo |
| 表结构 | `mes-application/.../schema/demo_db_en.sql` → `basic_workstation` | 列名、默认值、序列 |
| 前端占位 | `mesq/mes-web/src/routes/company-structure/workstations/index.tsx` | 替换为真实列表页 |
| API 骨架 | `mesq/mes-api/src/index.ts`、`errorHandler.ts`、`client.ts` | 挂载路由与错误格式 |

### 2.1 表结构（本期读写字段）

表：`basic_workstation`  
序列：`basic_workstation_id_seq`

| 列名 | TS 字段 | 必填 | 默认 | 本期 |
|------|---------|------|------|------|
| id | id | ✓ | nextval | 读写 |
| number | number | ✓ 唯一 | | 读写 |
| name | name | ✓ | | 读写 |
| description | description | | | 读写 |
| workstationtype_id | workstationTypeId | ✓ | | 读写 |
| division_id | divisionId | | | 读写 |
| productionline_id | productionLineId | | | 读写 |
| serialnumber | serialNumber | | | 读写 |
| series | series | | | 读写 |
| producer | producer | | | 读写 |
| productiondate | productionDate | | | 读写 |
| state | state | | `01stopped` | 新建写默认，列表展示 |
| buffer | buffer | | false | 读写 |
| active | active | | true | 新建写默认，列表展示 |

忽略：`operation_id`、`udtnumber`、`wnknumber`、`staff_id`、入厂/退出日期、尺寸、`entityversion`、附件等。

### 2.2 关联关系（创建时需知）

```
工作站类型 1 ──必填──► 工作站
生产部门  1 ──可选──► 工作站
生产线    1 ──可选──► 工作站
生产部门 ←──M2M──► 生产线   （jointable_division_productionline）
```

新增表单级联（对齐原 UI）：先选部门 → 生产线下拉仅展示该部门已关联的线。

---

## 3. 接口定义（仅 GET / POST）

Base：`/api/v1`

### 3.1 本模块

| Method | Path | 说明 |
|--------|------|------|
| GET | `/workstations` | 列表：分页；JOIN 返回类型/部门/生产线名称 |
| POST | `/workstations` | 新增 |

不做：`GET /:id`、更新、active、delete、state。

### 3.2 下拉依赖（若对应模块未就绪，本期需最小实现）

| Method | Path | 用途 |
|--------|------|------|
| GET | `/workstation-types?active=true&size=1000` | 类型 Select（必填） |
| GET | `/divisions?active=true&size=1000` | 部门 Select |
| GET | `/production-lines?active=true&divisionId=&size=1000` | 生产线 Select（按部门过滤） |

> 若三模块已上线，直接复用；否则本期至少提供上述三个只读 list（可极简，仅 id/number/name）。

### 3.3 `GET /workstations`

Query：

| 参数 | 默认 | 说明 |
|------|------|------|
| page | 1 | 页码 |
| size | 20 | 页大小；需要一次拉全量时可传较大 size（如 1000） |
| search | | 可选，模糊匹配 number、name |

响应：

```json
{
  "data": [
    {
      "id": 1,
      "number": "WS-001",
      "name": "铣床-1",
      "description": null,
      "workstationTypeId": 1,
      "workstationTypeName": "铣床",
      "divisionId": 1,
      "divisionName": "机加车间",
      "productionLineId": 1,
      "productionLineName": "装配一线",
      "serialNumber": null,
      "series": null,
      "producer": null,
      "productionDate": null,
      "state": "01stopped",
      "buffer": false,
      "active": true
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

列表 SQL 要点：

```sql
SELECT w.*,
       wt.name AS workstation_type_name,
       d.name  AS division_name,
       pl.name AS production_line_name
FROM basic_workstation w
LEFT JOIN basic_workstationtype wt ON wt.id = w.workstationtype_id
LEFT JOIN basic_division d ON d.id = w.division_id
LEFT JOIN productionlines_productionline pl ON pl.id = w.productionline_id
ORDER BY w.number DESC
```

### 3.4 `POST /workstations`

Body：

```json
{
  "number": "WS-001",
  "name": "铣床-1",
  "description": null,
  "workstationTypeId": 1,
  "divisionId": 1,
  "productionLineId": 1,
  "serialNumber": null,
  "series": null,
  "producer": null,
  "productionDate": null,
  "buffer": false
}
```

规则：

- `number`、`name`、`workstationTypeId` 必填（zod）
- `number` 唯一；冲突返回 409
- `id`：`SELECT nextval('basic_workstation_id_seq')`
- `state` 固定写入 `01stopped`；`active` 默认 `true`
- 不做 FK 强校验（与总 spec 一致）；`productionLineId` 建议与所选部门在 junction 中存在，但本期可不强制

成功：`201` + `{ "data": Workstation }`

---

## 4. 前端规划

### 4.1 页面

| 项 | 值 |
|----|-----|
| 路由 | `/company-structure/workstations` |
| 文件 | `mes-web/src/routes/company-structure/workstations/index.tsx` |
| 表单 | `mes-web/src/components/company-structure/WorkstationForm.tsx` |
| 类型 | `mes-web/src/types/workstation.ts` |
| API | `mes-web/src/api/workstations.ts` |

### 4.2 列表页

- Ant Design `Table` + ahooks `useAntdTable`（或等价分页请求）
- 顶部：「新建」按钮；可选 search 框
- 列（对齐原列表核心信息）：

| 列 | 字段 |
|----|------|
| 编号 | number |
| 名称 | name |
| 工作站类型 | workstationTypeName |
| 部门 | divisionName |
| 生产线 | productionLineName |
| 状态 | state → 停止 / 运行 |
| 启用 | active |

本期无编辑、删除、启用操作列。

### 4.3 新增表单

Modal + Form，字段：

| 字段 | 控件 | 必填 |
|------|------|------|
| number | Input | ✓ |
| name | Input | ✓ |
| description | TextArea | |
| workstationTypeId | Select（远程） | ✓ |
| divisionId | Select（远程） | |
| productionLineId | Select（远程，随部门过滤） | |
| serialNumber | Input | |
| series | Input | |
| producer | Input | |
| productionDate | DatePicker | |
| buffer | Switch | |

提交成功后关闭 Modal 并刷新列表。

---

## 5. 后端文件结构

```
mes-api/src/
├── db/schema/workstation.ts          # Drizzle 表定义
├── schemas/workstation.ts            # zod：listQuery + createBody
├── services/workstation.service.ts   # list / create
└── routes/workstations.ts            # GET / POST，挂到 /api/v1
```

Service：

- `list(query)` — 分页 + search + JOIN 名称
- `create(input)` — nextval + insert

挂载：

```ts
// index.ts
app.use('/api/v1', workstationsRouter);
```

---

## 6. 任务拆解

| ID | 项 | 说明 |
|----|-----|------|
| W1 | Drizzle schema | `basic_workstation` 本期字段映射 |
| W2 | zod schemas | create / list query |
| W3 | service list + create | JOIN、nextval、唯一冲突处理 |
| W4 | routes | `GET/POST /workstations` |
| W5 | 下拉依赖确认 | 复用或补最小 GET list（类型/部门/生产线） |
| W6 | 前端 types + api | |
| W7 | 列表页 | 替换 PlaceholderPage |
| W8 | WorkstationForm | 新建 Modal + 部门→生产线级联 |
| W9 | 联调验收 | 见下节 |

---

## 7. 验收标准

- [ ] `GET /api/v1/workstations` 返回全部（分页）记录，含类型/部门/生产线名称
- [ ] 列表页可展示数据，无编辑/删除按钮
- [ ] 「新建」可打开表单；必填：编号、名称、工作站类型
- [ ] 选部门后生产线下拉仅显示该部门关联线（有数据时）
- [ ] `POST` 成功写入 `basic_workstation`，列表刷新可见
- [ ] `number` 重复返回 409 / 前端提示错误
- [ ] 新建记录 `state=01stopped`、`active=true`

---

## 8. 依赖与前置数据

业务建数顺序（否则下拉为空或无法选类型）：

1. 工作站类型  
2. 工厂 → 生产部门  
3. 生产线，并在详情「工作站」页签关联部门  
4. 再建工作站  

技术前置：`mes-api` / `mes-web` 脚手架已可用；数据库可连现有 PostgreSQL。

---

## 9. 后续可扩展（本期明确不做）

编辑、详情、启用/停用、软删除、state 启停、多条件筛选、附件与导入。接口预留风格与既有模块一致（POST `/:id`、`/:id/active`、`/:id/delete`、`/:id/state`）。
