# AGENTS.md - 海贼工作台项目约定

## 项目概述

单文件 HTML 个人工作台应用（海贼王 One Piece 主题），含 10 个功能模块、AI 快捷录入、Supabase 云同步、PWA 离线支持、移动端响应式适配。

## 技术栈

- React 18 + ReactDOM 18 (CDN, production)
- Babel Standalone (浏览器端 JSX 编译)
- Tailwind CSS (CDN Play)
- @supabase/supabase-js v2 (云同步)
- 无构建工具，无 npm

## 文件结构

```
D:\个人工作台搭建\
├── 个人工作台.html      # 主应用（~2926行）
├── index.html           # 部署入口（与主文件同步）
├── manifest.json        # PWA 清单
├── sw.js                # Service Worker
└── avatars/             # 10个角色头像 PNG (1024x1024)
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
父元素必须有 `group` class，否则 hover 效果不生效。

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

- 表名：workstation_data (user_id UUID PK, data JSONB, updated_at)
- 认证：邮箱+密码登录/注册
- 同步：数据变化 1500ms 防抖 upsert
- Session 自动恢复

## 移动端适配

- 断点：768px
- 桌面端：三栏布局（左导航 w-60 + 主内容 + 右侧栏 w-64）
- 移动端：固定 header + 抽屉菜单 + 全宽内容
- 响应式网格：grid-cols-2 sm:grid-cols-5 等

## 部署

| 平台 | 地址 |
|------|------|
| GitHub Pages | https://pandaswt.github.io/pirate-workstation/ |
| Netlify | https://cerulean-cobbler-255451.netlify.app/ |
| GitHub 仓库 | pandaswt/pirate-workstation (Public) |

## 常见陷阱

1. **localStorage 旧数据覆盖**：修改角色映射后必须在加载处用 DEFAULT_CREW 迁移
2. **已删除习惯残留打卡记录**：统计时用 `habits.some(h=>h.id===id)` 过滤
3. **Write 工具竞态**：先写到 outputs 再 cp 覆盖
4. **github.com:443 不通**：token 嵌入 remote URL
5. **PWA 需 HTTPS**：file:// 协议无法注册 Service Worker

## 修改工作流

1. Read 读取目标代码段
2. Edit 精准替换（确保 old_string 唯一匹配）
3. cp 到 outputs 目录备份
4. 用户 Ctrl+F5 刷新查看效果
