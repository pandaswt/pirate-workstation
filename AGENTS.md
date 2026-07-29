# AGENTS.md - 海贼工作台项目约定

## 项目概述

单文件 HTML 个人工作台应用（海贼王 One Piece 主题），含 10 个功能模块、AI 快捷录入、Supabase 云同步（含手动同步/拉取按钮 + Realtime 自动拉取）、PWA 离线支持、移动端响应式适配。

## 技术栈

- React 18 + ReactDOM 18 (CDN unpkg.com, production)
- Babel Standalone (浏览器端 JSX 编译)
- Tailwind CSS (CDN Play)
- @supabase/supabase-js v2 (CDN unpkg.com，云同步)
- 无构建工具，无 npm

## 文件结构

```
D:\个人工作台搭建\
├── 个人工作台.html      # 主应用（~3018行）
├── index.html           # 部署入口（必须与主文件保持同步！）
├── manifest.json        # PWA 清单
├── sw.js                # Service Worker
└── avatars/             # 10个角色头像 PNG (128x128)
```

## CDN 配置（5个库）

⚠️ Supabase SDK **必须用 unpkg.com**，不能用 cdn.jsdelivr.net（国内经常超时导致 `_supabase` 为 null，登录弹窗不出现）。

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

## 编码规范

### 状态更新
Babel standalone 环境下优先用 `Object.assign` 构造新对象，函数式更新器可能不触发重渲染：
```js
setState(Object.assign({}, state, { key: val }));  // 推荐
```

### JSX 中文字符串
复杂场景用 Unicode 转义 `(\uXXXX)` 避免编码异常导致白屏。

### JSX 属性值拼接
必须用花括号表达式：`placeholder={"前缀" + var}`，不能写 `placeholder="前缀" + var`。

### SVG 组件
不能用 `dangerouslySetInnerHTML`，须用 JSX 子元素写法（命名空间冲突会致白屏）。

### Tailwind group-hover
父元素必须有 `group` class，否则 hover 效果不生效。移动端（768px以下）通过 CSS 媒体查询强制 `.group .opacity-0` 和 `.group .group-hover\:opacity-100` 显示为 `opacity: 0.6`，解决触屏设备无 hover 导致操作按钮不可见的问题。

## 主题配色

| 变量 | 值 | 用途 |
|------|-----|------|
| --op-deep-blue | #1B2838 | 侧边栏背景/主文字 |
| --op-pirate-red | #C0392B | 按钮/强调色 |
| --op-cream | #FDF5E6 | 内容区背景 |
| --op-gold | #F4D03F | 标题/装饰 |
| --op-border | #2C3E50 | 边框色 |

## 角色映射（DEFAULT_CREW）

| 模块 | key | 角色 |
|------|-----|------|
| 工作台概览 | dashboard | luffy (路飞) |
| 日程管理 | schedule | law (罗) |
| 习惯打卡 | habits | zoro (索隆) |
| 运动记录 | exercise | usopp (乌索普) |
| 心情日记 | mood | chopper (乔巴) |
| 饮食记录 | meals | sanji (山治) |
| 记账 | finance | nami (娜美) |
| 读书笔记 | notes | robin (罗宾) |
| 工作日报 | daily | ace (艾斯) |
| 航海周报 | weekly | brook (布鲁克) |

## 数据持久化

- localStorage key: `personal_workstation_v1`
- 16 项数据：todos, checkins, dailys, weeklys, habits, habitCheckins, pomoSessions, exercises, moods, meals, finances, notes, expenseCategories, incomeCategories, navOrder, customExTypes
- 加载时自动用 DEFAULT_CREW 迁移 crew 字段（保留排序，更新角色）

## Supabase 云同步

### 数据表
- 表名：workstation_data (user_id UUID PK, data JSONB, updated_at)
- RLS策略：auth.uid() = user_id

### 认证
- 邮箱+密码登录/注册，全屏模态框
- Session 自动恢复：挂载时 getSession() + onAuthStateChange 监听

### 同步机制
- **自动同步（推送）**：数据变化 1500ms 防抖 upsert（依赖 cloudReady state 触发）
- **手动推送**：侧边栏底部「↻ 同步」按钮（handleForceSync），立即上传本地数据到云端
- **手动拉取**：侧边栏底部「↓ 拉取」按钮（pullFromCloud），立即从云端下载最新数据
- **Realtime 自动拉取**：Supabase Realtime 订阅 workstation_data 表变更，另一台设备推送后自动触发 pullFromCloud
- **窗口聚焦拉取**：window focus 事件自动触发 pullFromCloud，切换回工作台时获取最新数据
- **拉取守卫**：`isLoadingFromCloud` ref 在拉取期间及之后 2s 内阻止自动推送，防止拉取的数据被回推覆盖
- **首次登录**：loadFromCloud 使用 `.maybeSingle()` 查询；若无云端数据，自动 setTimeout(syncToCloud, 500) 推送本地数据
- **cloudReady state**：loadFromCloud 完成后 setCloudReady(true)，加入 debounced sync 依赖数组确保登录后触发首次同步
- **同步状态**：cloudSyncStatus (idle/syncing/synced/error)，侧边栏圆点+文字指示

### Realtime 配置
- Supabase Dashboard → Database → Publications → `supabase_realtime` → 添加 `workstation_data` 表
- 未开启时 Realtime 订阅不生效，但窗口聚焦拉取和手动拉取仍可用

### 关键修复
- `.maybeSingle()` 而非 `.single()`：新用户首次登录无数据时 `.single()` 会报错导致 `initialLoadDone` 永远不为 true
- `initialLoadDone.current = true` 必须在 try-catch 之后设置（不能仅在成功路径中）
- `cloudReady` 是 state（非 ref），改变后会触发 re-render 和 debounced sync useEffect

## 移动端适配

### 断点与媒体查询
- 断点：768px
- `max-width: 768px`：隐藏桌面侧边栏，显示移动header、抽屉菜单、底部导航；group-hover 操作按钮常驻显示
- `min-width: 769px`：隐藏移动header、抽屉overlay、底部导航

### 桌面端布局
三栏布局（左导航 w-60 + 主内容 flex-1 + 右侧栏 w-64，仅日程/打卡页）

### 移动端布局
- **顶部Header**：fixed定位，深蓝渐变背景，左侧汉堡菜单(金色三线SVG)、中间标题
- **抽屉式菜单**：75%屏幕宽(max 280px)，半透明遮罩点击关闭
- **主内容区**：full width，padding-top 56px

### 响应式表单模式
所有多字段输入表单使用 `flex-col sm:flex-row gap-2` 模式：
- 运动记录：自定义类型行 + 日期/时长/备注/添加行
- 日程管理：列表视图和日历视图的添加待办表单（输入框独占一行，日期/优先级/标签/按钮第二行）
- 记账：日期/金额/备注/添加行
- 编辑待办：flex-wrap 自动换行
- 心情日记：emoji按钮 `gap-2 sm:gap-4 flex-wrap`

### 响应式网格
- 概览统计：`grid-cols-2 sm:grid-cols-5`
- 活动摘要/记账统计：`grid-cols-1 sm:grid-cols-3`
- 日报/周报表单：`grid-cols-1 sm:grid-cols-2`（日期+项目并排）
- 记账饼图：`grid-cols-1 sm:grid-cols-2`
- 页面标题：`flex-col sm:flex-row items-start sm:items-center gap-3`

## 部署

| 平台 | 地址 |
|------|------|
| GitHub Pages | https://pandaswt.github.io/pirate-workstation/ |
| Netlify | https://cerulean-cobbler-255451.netlify.app/ |
| GitHub 仓库 | pandaswt/pirate-workstation (Public) |

**重要**：修改 `个人工作台.html` 后必须 `cp` 同步到 `index.html`（GitHub Pages 部署入口），否则线上版本不会更新。

## 常见陷阱

1. **localStorage 旧数据覆盖**：修改角色映射后必须在加载处用 DEFAULT_CREW 迁移
2. **已删除习惯残留打卡记录**：统计时用 `habits.some(h=>h.id===id)` 过滤
3. **Write 工具竞态**：先写到 outputs 再 cp 覆盖
4. **github.com:443 不通**：token 嵌入 remote URL，set GIT_TERMINAL_PROMPT=0
5. **PWA 需 HTTPS**：file:// 协议无法注册 Service Worker
6. **index.html 不同步**：修改主文件后必须 cp 到 index.html，否则 GitHub Pages 仍是旧版
7. **Supabase CDN 用 jsdelivr**：国内超时导致 _supabase 为 null，必须用 unpkg.com
8. **Supabase .single() 查询**：新用户无数据时报错，必须用 .maybeSingle()
9. **移动端删除按钮不可见**：group-hover 在触屏无效，需 CSS 媒体查询强制显示
10. **Supabase Realtime 不生效**：需在 Dashboard → Publications → supabase_realtime 中添加 workstation_data 表（不是 Replication 页面）
11. **跨设备数据不实时**：推送方向有 1500ms 防抖自动推送；拉取方向依赖 Realtime 订阅 + 窗口聚焦 + 手动拉取按钮

## 修改工作流

1. Read 读取目标代码段
2. Edit 精准替换（确保 old_string 唯一匹配）
3. `cp 个人工作台.html index.html` 同步部署入口
4. cp 到 outputs 目录备份
5. git add + commit + push（set GIT_TERMINAL_PROMPT=0）
6. 用户 Ctrl+Shift+R 刷新查看效果
