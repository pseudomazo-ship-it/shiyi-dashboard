/* ============================================================
   统一顶部导航组件
   ------------------------------------------------------------
   用法（在每个看板 <body> 最顶部）：
       <div id="app-nav"></div>
       <script src="/common/nav.js"></script>

   可选属性：
       data-search="1"   渲染搜索框（首页用）
       data-nav="0"      隐藏右上角菜单（首页用，页面本身就是导航）

   说明：
     - 自动按当前页面 URL 路径高亮对应菜单项，匹配不到时回退用 <title> 匹配
     - 移动端（<=768px）折叠为汉堡菜单，搜索框自动隐藏
     - 增删菜单项只改下面的 NAV_ITEMS 数组
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 菜单配置（改这里就能增减入口） ---------- */
    var NAV_ITEMS = [
        { label: '首页',         href: '/',           match: ['/'] },
        { label: '数据日报',     href: '/daily/',     match: ['/daily/'] },
        { label: '主体财务看板', href: '/finance/',   match: ['/finance/'] },
        { label: '快递决策速查', href: '/logistics/', match: ['/logistics/'] }
    ];

    /* ---------- 品牌（logo 留空则不显示方块图标） ---------- */
    var BRAND = { text: '十一.11个人工作台', logo: '', href: '/' };

    /* 页面标题关键字 → 菜单项（路径匹配失败时的兜底） */
    var TITLE_HINTS = [
        { key: '数据日报', href: '/daily/' },
        { key: '主体财务', href: '/finance/' },
        { key: '快递决策', href: '/logistics/' },
        { key: '工作台',   href: '/' }
    ];

    /* ---------- 读取本脚本上的配置属性 ---------- */
    function scriptTag() {
        if (document.currentScript) { return document.currentScript; }
        var all = document.querySelectorAll('script[src*="nav.js"]');
        return all.length ? all[all.length - 1] : null;
    }
    var ME = scriptTag();
    var ENABLE_SEARCH = !!(ME && ME.getAttribute('data-search') === '1');
    var ENABLE_MENU   = !(ME && ME.getAttribute('data-nav') === '0');

    /* ---------- 工具 ---------- */
    function normPath(p) {
        p = (p || '/').split('?')[0].split('#')[0];
        p = p.replace(/index\.html$/, '');
        if (p.charAt(0) !== '/') { p = '/' + p; }
        if (p === '') { p = '/'; }
        return p;
    }

    function activeByPath(cur) {
        var best = -1, bestLen = -1;
        for (var i = 0; i < NAV_ITEMS.length; i++) {
            var m = NAV_ITEMS[i].match;
            for (var j = 0; j < m.length; j++) {
                var k = m[j];
                var hit = (k === '/') ? (cur === '/') : (cur === k || cur.indexOf(k) === 0);
                if (hit && k.length > bestLen) { best = i; bestLen = k.length; }
            }
        }
        return best;
    }

    function activeByTitle() {
        var t = (document.title || '');
        for (var i = 0; i < TITLE_HINTS.length; i++) {
            if (t.indexOf(TITLE_HINTS[i].key) >= 0) {
                for (var j = 0; j < NAV_ITEMS.length; j++) {
                    if (NAV_ITEMS[j].href === TITLE_HINTS[i].href) { return j; }
                }
            }
        }
        return -1;
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ---------- 搜索过滤 ---------- */
    function bindSearch() {
        var input = document.getElementById('appNavSearch');
        if (!input) { return; }

        var hint = document.getElementById('searchEmpty');

        function apply() {
            var q = (input.value || '').trim().toLowerCase();

            /* 卡片过滤 */
            var cards = document.querySelectorAll('.dashboard-link');
            var shown = 0;
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                var txt = (c.getAttribute('data-name') || c.textContent || '').toLowerCase();
                var hit = !q || txt.indexOf(q) >= 0;
                c.style.display = hit ? '' : 'none';
                if (hit) { shown++; }
            }

            /* 空分类整体隐藏 + 同步分类计数 */
            var cats = document.querySelectorAll('.cat');
            for (var k = 0; k < cats.length; k++) {
                var list = cats[k].querySelectorAll('.dashboard-link');
                var n = 0;
                for (var m = 0; m < list.length; m++) {
                    if (list[m].style.display !== 'none') { n++; }
                }
                cats[k].style.display = n ? '' : 'none';
                var cnt = cats[k].querySelector('.cat-count');
                if (cnt) { cnt.textContent = n; }
            }

            /* 搜索时收起常用入口和分区标题，让结果更聚焦 */
            var quicks = document.querySelectorAll('.quick-grid');
            for (var p = 0; p < quicks.length; p++) { quicks[p].style.display = q ? 'none' : ''; }
            var secs = document.querySelectorAll('.section-title');
            for (var s = 0; s < secs.length; s++) { secs[s].style.display = q ? 'none' : ''; }

            /* 无结果提示 */
            if (hint) { hint.classList.toggle('show', shown === 0 && q !== ''); }
        }

        input.addEventListener('input', apply);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.value = '';
                apply();
            }
        });

        /* 快捷键：按 / 聚焦搜索框 */
        document.addEventListener('keydown', function (e) {
            if (e.key === '/' && document.activeElement !== input &&
                !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
                e.preventDefault();
                input.focus();
            }
        });
    }

    /* ---------- 构建导航 ---------- */
    function build() {
        var host = document.getElementById('app-nav');
        if (!host) { return; }

        var cur = normPath(window.location.pathname);
        var active = activeByPath(cur);
        if (active < 0) { active = activeByTitle(); }

        var items = NAV_ITEMS.map(function (it, i) {
            var cls = (i === active) ? ' class="active"' : '';
            return '<li><a href="' + esc(it.href) + '"' + cls + '>' + esc(it.label) + '</a></li>';
        }).join('');

        var brandHtml =
            '<a class="nav-brand" href="' + esc(BRAND.href) + '">' +
                (BRAND.logo ? '<span class="logo">' + esc(BRAND.logo) + '</span>' : '') +
                '<span>' + esc(BRAND.text) + '</span>' +
            '</a>';

        var searchHtml = ENABLE_SEARCH
            ? '<div class="nav-search">' +
                  '<span class="ico">🔍</span>' +
                  '<input id="appNavSearch" type="search" placeholder="搜索看板…" autocomplete="off">' +
              '</div>'
            : '';

        var menuHtml = ENABLE_MENU
            ? '<button class="nav-toggle" type="button" aria-label="打开菜单" aria-expanded="false">☰</button>' +
              '<ul class="nav-links" id="appNavLinks">' + items + '</ul>'
            : '';

        host.outerHTML = '<nav class="app-nav">' + brandHtml + searchHtml + menuHtml + '</nav>';

        /* 汉堡菜单交互 */
        var toggle = document.querySelector('.nav-toggle');
        var links = document.getElementById('appNavLinks');
        if (toggle && links) {
            toggle.addEventListener('click', function () {
                var open = links.classList.toggle('open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                toggle.textContent = open ? '✕' : '☰';
            });
            links.addEventListener('click', function (e) {
                if (e.target && e.target.tagName === 'A') {
                    links.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.textContent = '☰';
                }
            });
            document.addEventListener('click', function (e) {
                if (!links.classList.contains('open')) { return; }
                if (links.contains(e.target) || toggle.contains(e.target)) { return; }
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.textContent = '☰';
            });
        }

        if (ENABLE_SEARCH) { bindSearch(); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
