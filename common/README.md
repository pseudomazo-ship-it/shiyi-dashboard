# 看板导航系统 · 使用说明

一个域名下挂多个看板，共用统一导航和样式。

---

## 一、加一个新看板（3 步）

### ① 建目录、放文件

```
/你的看板名/index.html
```

> 目录名用小写英文，例如 `daily` / `finance` / `logistics`
> 文件必须是 `index.html`，这样访问 `域名/你的看板名/` 就能打开

### ② 让页面接入统一导航（2 行）

在 HTML 的 `<head>` 里加：

```html
<link rel="stylesheet" href="/common/style.css">
```

在 `<body>` 的最顶部加：

```html
<div id="app-nav"></div>
<script src="/common/nav.js"></script>
```

> ⚠️ 路径必须以 `/` 开头（绝对路径）。写成 `common/style.css` 的话，在子目录页面会 404。

**已有页面不想手改的话，用注入工具**：

```bash
python common/inject_ui.py 你的看板名/index.html
```

自动插入上面两处，可重复执行（幂等，不会重复插入）。

### ③ 在导航里加一项

编辑 `common/nav.js`，在 `NAV_ITEMS` 数组里加一行：

```javascript
{ label: '看板名', href: '/你的看板名/', match: ['/你的看板名/'] },
```

再到 `index.html` 的 `.dashboard-grid` 里加一张卡片：

```html
<a class="dashboard-link" href="/你的看板名/">
    <div class="icon">📈</div>
    <h3>看板名</h3>
    <p>一句话说明</p>
</a>
```

---

## 二、目录结构

```
/
├── index.html              首页导航
├── common/
│   ├── style.css           统一样式库（变量/导航/卡片/表格/按钮/响应式）
│   ├── nav.js              导航组件（路径高亮 + 汉堡菜单）
│   └── inject_ui.py        导航注入工具
├── daily/index.html        数据日报
├── finance/index.html      主体财务看板
└── logistics/index.html    快递决策速查表
```

---

## 三、设计规范

| 项目 | 值 |
|---|---|
| 主色（导航/标题） | `#1E3A5F` 深海军蓝 |
| 强调色（按钮/高亮） | `#3B82F6` 亮蓝 |
| 页面背景 | `#F5F7FA` |
| 卡片 | `#FFFFFF` 白底 + 圆角 16px + 柔和阴影 |
| 字体 | system-ui + 微软雅黑 |
| 导航高度 | 64px（移动端折叠为汉堡菜单） |

**样式库里可用的 class**：

```
布局    container / page-header / card / card-title
数字卡  stats-grid / stat-card（+ .success / .warning / .danger）
表格    table-wrap + 原生 table
标签    tag / tag-success / tag-warning / tag-danger / tag-info / tag-gray
按钮    btn / btn-primary / btn-outline / btn-danger
首页    dashboard-grid / dashboard-link
工具    mt-1~3 / mb-1~3 / flex / flex-between / flex-center / text-muted / text-sm / text-lg
```

---

## 四、注意事项

**1. 自动生成的看板，要让生成器带上导航**

`daily/index.html` 和 `finance/index.html` 是脚本自动生成的，脚本整份重写 HTML 会冲掉导航。
生成器产出后要调用一次注入：

```python
import subprocess
subprocess.run(['python', 'common/inject_ui.py', 'daily/index.html'])
```

**2. 多个来源自动 push 时，各推各的目录**

不要整仓库覆盖式 push，否则会冲掉别的看板。只 add/commit 自己那个目录下的文件。

**3. 导航项超过 6~7 个时建议分组**

`nav.js` 的 `NAV_ITEMS` 现在是一维数组，元素多了导航会挤。
到时候可以按用途分组（例如「运营数据 / 个人」），改结构即可。

**4. 安全分层**

当前域名是 DNS 直连（不走 Cloudflare 代理），**没有访问控制**，页面上谁拿到网址谁就能看。
- 公司数据（日报 / 财务 / 快递规则）不要和对外公开的个人内容放在同一个导航入口层
- 需要真防护就得改回 Cloudflare 代理 + Access（代价是延迟从 ~0.4s 变 ~0.18s）
