# 个人工作台 · 使用说明

一个域名下放多个看板。**首页负责导航，各看板彼此完全独立。**

---

## ⚠️ 核心规则（先读这条）

```
各看板对接不同的人，谁都不能看到别的看板的存在。

  首页  /            有导航，列出所有看板入口
                     —— 只给需要总览的人（你自己）

  看板  /xxx/        【完全独立】：不引 common 里的任何东西
                     无导航、无品牌、无其他看板入口
                     看板自带完整样式和自己的密码门
```

**违反这条就泄露了**：只要看板里带了导航，拿到这个看板链接的人
就能顺着看到你还有哪些看板（甚至点进去）。

---

## 一、加一个新看板（3 步）

### ① 建目录、放文件

```
/你的看板名/index.html
```

目录名用小写英文（`daily` / `finance` / `logistics` 这种），
文件名必须是 `index.html`，这样访问 `域名/你的看板名/` 就能打开。

### ② 页面保持独立 —— 什么都不用引

**不要引** `/common/style.css`，**不要引** `/common/nav.js`。

看板页面自带完整样式。**引了反而出问题**：
- 引 `nav.js` → 泄露其他看板
- 引 `style.css` → 可能和看板自己的样式打架

### ③ 在首页加一个入口

编辑 `index.html`，在对应分类的 `.dashboard-grid` 里加一张卡片：

```html
<a class="dashboard-link" href="/你的看板名/" data-name="关键词1 关键词2 用于搜索">
    <div class="icon">📈</div>
    <h3>看板名</h3>
    <p>一句话说明</p>
    <span class="open-link">打开看板 →</span>
</a>
```

然后把该分类标题里的 `.cat-count` 数字 +1。

**如还想加进顶部菜单**：编辑 `common/nav.js` 的 `NAV_ITEMS` 数组加一行。

---

## 二、目录结构

```
/
├── index.html              首页（个人工作台）—— 唯一有导航的页面
├── common/
│   ├── style.css           首页样式库
│   ├── nav.js              首页导航组件（含搜索框）
│   ├── inject_ui.py        工具：注入/移除导航、升资源版本号
│   └── README.md           本文件
├── daily/index.html        数据日报      （独立）
├── finance/index.html      主体财务看板  （独立）
└── logistics/index.html    快递决策速查表（独立）
```

---

## 三、首页样式规范

| 项目 | 值 |
|---|---|
| 主色（导航/标题） | `#1E3A5F` 深海军蓝 |
| 强调色（按钮/高亮） | `#3B82F6` 亮蓝 |
| 页面背景 | `#F5F7FA` |
| 卡片 | `#FFFFFF` 白底 + 圆角 16px + 柔和阴影 |
| 字体 | system-ui + 微软雅黑 |
| 导航高度 | 64px（移动端折叠为汉堡菜单） |

**首页可用的 class**：

```
布局    container / page-header / hero / section-title / cat / cat-title / cat-count
入口    quick-grid / quick-card（常用入口）
卡片    dashboard-grid / dashboard-link（+ .disabled 表示待接入）/ open-link
搜索    nav-search（导航内搜索框，data-search="1" 开启）
工具    mt-1~3 / mb-1~3 / flex / flex-between / flex-center / text-muted / text-sm / text-lg
```

---

## 四、维护工具（`common/inject_ui.py`）

```bash
# 检查某页面是否独立（加看板后自检用）
python common/inject_ui.py --check daily/index.html

# 万一给独立看板误加了导航，一键移除
python common/inject_ui.py --strip daily/index.html finance/index.html logistics/index.html

# 改了 style.css / nav.js 后，升版本号让浏览器立刻拉新版（防缓存）
python common/inject_ui.py --bump 2 index.html
```

> 资源引用带 `?v=1`。**改了 CSS/JS 一定要升版本号**，否则浏览器缓存旧版，
> 你会看到"改了没生效"。

---

## 五、自动更新的看板怎么处理

`daily/index.html`（数据日报）和 `finance/index.html`（主体财务看板）是脚本自动生成的，
整份重写 HTML。

**两者都不会破坏独立性**：

- **数据日报**：生成器 `scripts/daily_dashboard_v2.py` 跑完会调 `--strip` 兜底移除导航
- **主体财务看板**：周更脚本 `weekly_sync.py` 是「读 → 替换 QDATA → 写回」模式，
  只换数据不动结构，**路径已指向 `finance/index.html`**

**新增自动更新看板时**：确认生成脚本不会往页面里塞导航，
并在生成后跑一次 `--strip` 兜底。
