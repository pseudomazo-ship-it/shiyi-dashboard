/* ============================================================
   统一导航组件（两种模式）
   ------------------------------------------------------------
   顶部横导航（默认，给子页面用）：
       <div id="app-nav"></div>
       <script src="/common/nav.js"></script>

   左侧竖导航（首页工作台用）：
       <div id="app-nav"></div>
       <script src="/common/nav.js" data-sidebar="1" data-clock="1"></script>

   可选属性：
       data-sidebar="1"   渲染左侧竖导航（含品牌区、菜单、页脚）
       data-clock="1"     启动实时时钟（更新 #liveTime）
       data-search="1"    绑定 #appNavSearch 搜索框（过滤 .dashboard-link）
       data-nav="0"       隐藏菜单（顶部模式下用）
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 菜单配置：母分类 > 子分类 ----------
       href 为空 = 还没接入（侧边栏里显示为灰色不可点） */
    var NAV_GROUPS = [
        {
            title: '运营数据',
            items: [
                { label: '数据日报',     href: '/daily/',     icon: '📊', match: ['/daily/'] },
                { label: '主体财务看板', href: '/finance/',   icon: '💰', match: ['/finance/'] },
                { label: '快递决策看板', href: '/logistics/board/', icon: '🚛', match: ['/logistics/board/'] },
                { label: '快递价格表', href: '/logistics/', icon: '🚚', match: ['/logistics/'] }
            ]
        },
        {
            title: '办公工具',
            items: [
                { label: '待办清单',       href: '', icon: '📝' },
                { label: '退款处理工作台', href: '', icon: '🛠️' },
                { label: '商品上架控制台', href: '', icon: '📦' }
            ]
        },
        {
            title: '技能资源',
            items: [
                { label: 'Agent Skills 管理台', href: '/skills/', icon: '🧩', match: ['/skills/'] },
                { label: '客服话术库',          href: '', icon: '💬' }
            ]
        },
        {
            title: '知识资料',
            items: [
                { label: '平台规则库',       href: '', icon: '📚' },
                { label: '快递物流规则汇总', href: '', icon: '📋' }
            ]
        }
    ];

    /* 扁平化（顶部横导航 / 标题兜底仍用这个） */
    var NAV_ITEMS = (function () {
        var out = [];
        for (var g = 0; g < NAV_GROUPS.length; g++) {
            var its = NAV_GROUPS[g].items;
            for (var i = 0; i < its.length; i++) {
                if (its[i].href) { out.push(its[i]); }
            }
        }
        return out;
    })();

    /* 首页入口单独提出来（侧边栏品牌已链首页，这里只给顶部模式兜底） */
    var HOME_ITEM = { label: '首页', href: '/', match: ['/'], icon: '🏠' };

    var BRAND = { text: '十一.11个人工作台', logo: '', href: '/' };
    var SB_BRAND = { name: '十一.11', sub: '个人工作台', logo: '11', href: '/' };
    var SB_FOOT = '';   // 2026-10-07 起不显示（用户要求去掉）

    var TITLE_HINTS = [
        { key: '数据日报', href: '/daily/' },
        { key: '主体财务', href: '/finance/' },
        { key: '快递决策', href: '/logistics/' },
        { key: '工作台',   href: '/' }
    ];

    /* ---------- 读取脚本属性 ---------- */
    function scriptTag() {
        if (document.currentScript) { return document.currentScript; }
        var all = document.querySelectorAll('script[src*="nav.js"]');
        return all.length ? all[all.length - 1] : null;
    }
    var ME = scriptTag();
    function attr(n) { return ME ? ME.getAttribute(n) : null; }
    var SIDEBAR  = attr('data-sidebar') === '1';
    var CLOCK    = attr('data-clock') === '1';
    var SEARCH   = attr('data-search') === '1';
    var MENU     = attr('data-nav') !== '0';

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
    function activeIndex() {
        var a = activeByPath(normPath(window.location.pathname));
        return a < 0 ? activeByTitle() : a;
    }

    /* ---------- 实时时钟 ---------- */
    function bindClock() {
        var el = document.getElementById('liveTime');
        if (!el) { return; }
        function pad(n) { return n < 10 ? '0' + n : '' + n; }
        function tick() {
            var d = new Date();
            el.textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' +
                             d.getDate() + '日 ' + pad(d.getHours()) + ':' +
                             pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }
        tick();
        setInterval(tick, 1000);
    }

    /* ---------- 搜索过滤 ---------- */
    function bindSearch() {
        var input = document.getElementById('appNavSearch');
        if (!input) { return; }
        var hint = document.getElementById('searchEmpty');

        function apply() {
            var q = (input.value || '').trim().toLowerCase();

            var cards = document.querySelectorAll('.dashboard-link');
            var shown = 0;
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                var txt = (c.getAttribute('data-name') || c.textContent || '').toLowerCase();
                var hit = !q || txt.indexOf(q) >= 0;
                c.style.display = hit ? '' : 'none';
                if (hit) { shown++; }
            }

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

            var quicks = document.querySelectorAll('.quick-grid');
            for (var p = 0; p < quicks.length; p++) { quicks[p].style.display = q ? 'none' : ''; }
            var secs = document.querySelectorAll('.section-title');
            for (var s = 0; s < secs.length; s++) { secs[s].style.display = q ? 'none' : ''; }

            if (hint) { hint.classList.toggle('show', shown === 0 && q !== ''); }
        }

        input.addEventListener('input', apply);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { input.value = ''; apply(); }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === '/' && document.activeElement !== input &&
                !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
                e.preventDefault(); input.focus();
            }
        });
    }

    /* ---------- 移动端侧边栏开合 ---------- */
    function bindSidebarToggle() {
        var sb = document.getElementById('appSidebar');
        var mask = document.getElementById('sbMask');
        var btn = document.getElementById('sbToggle');
        if (!sb || !btn) { return; }
        function close() {
            sb.classList.remove('open');
            if (mask) { mask.classList.remove('show'); }
        }
        btn.addEventListener('click', function () {
            sb.classList.toggle('open');
            if (mask) { mask.classList.toggle('show', sb.classList.contains('open')); }
        });
        if (mask) { mask.addEventListener('click', close); }
        sb.addEventListener('click', function (e) {
            if (e.target && e.target.tagName === 'A') { close(); }
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) { close(); }
        });
    }

    /* ---------- 母分类展开 / 收起（默认全部展开） ---------- */
    function bindGroups() {
        var btns = document.querySelectorAll('.sb-group-btn');
        for (var i = 0; i < btns.length; i++) {
            (function (btn) {
                var arrow = btn.querySelector('.sb-arrow');
                btn.addEventListener('click', function () {
                    var g = btn.parentNode;
                    var open = g.classList.toggle('open');
                    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                    /* 直接用符号切换，比 CSS 旋转可靠 */
                    if (arrow) { arrow.textContent = open ? '▾' : '▸'; }
                });
            })(btns[i]);
        }
    }

    /* ---------- 当前路径是否匹配某个 href ---------- */
    function isActivePath(href) {
        if (!href) { return false; }
        var cur = normPath(window.location.pathname);
        if (href === '/') { return cur === '/'; }
        return cur === href || cur.indexOf(href) === 0;
    }

    /* ---------- 构建左侧竖导航（母分类 > 子分类） ---------- */
    function buildSidebar(host) {
        var homeHtml = '<a href="' + esc(HOME_ITEM.href) + '"' +
                       (isActivePath(HOME_ITEM.href) ? ' class="active"' : '') + '>' +
                       '<span class="i">🏠</span>首页</a>';

        var groupsHtml = NAV_GROUPS.map(function (g, gi) {
            var rows = g.items.map(function (it) {
                if (!it.href) {
                    return '<a href="#" class="disabled" title="待接入">' +
                           '<span class="i">' + it.icon + '</span>' +
                           '<span class="nm">' + esc(it.label) + '</span>' +
                           '<span class="tag-soon">待接入</span></a>';
                }
                return '<a href="' + esc(it.href) + '"' +
                       (isActivePath(it.href) ? ' class="active"' : '') + '>' +
                       '<span class="i">' + it.icon + '</span>' +
                       '<span class="nm">' + esc(it.label) + '</span>' + '</a>';
            }).join('');

            var live = 0;
            for (var k = 0; k < g.items.length; k++) { if (g.items[k].href) { live++; } }

            return '<div class="sb-group open" data-gi="' + gi + '">' +
                       '<button class="sb-group-btn" type="button" aria-expanded="true">' +
                           '<span class="sb-group-name">' + esc(g.title) + '</span>' +
                           '<span class="sb-group-cnt">' + live + '</span>' +
                           '<span class="sb-arrow">▾</span>' +
                       '</button>' +
                       '<div class="sb-group-items">' + rows + '</div>' +
                   '</div>';
        }).join('');

        host.outerHTML =
            '<aside class="sidebar" id="appSidebar">' +
                '<a class="sb-brand" href="' + esc(SB_BRAND.href) + '">' +
                    '<span class="sb-logo">' + esc(SB_BRAND.logo) + '</span>' +
                    '<span class="sb-name">' + esc(SB_BRAND.name) +
                        '<small>' + esc(SB_BRAND.sub) + '</small>' +
                    '</span>' +
                '</a>' +
                '<nav class="sb-nav">' + homeHtml + groupsHtml + '</nav>' +
            '</aside>' +
            '<div class="sb-mask" id="sbMask"></div>';

        document.body.classList.add('has-sidebar');
        bindSidebarToggle();
        bindGroups();
    }

    /* ---------- 构建顶部横导航 ---------- */
    function buildTopbar(host, active) {
        var items = NAV_ITEMS.map(function (it, i) {
            var cls = (i === active) ? ' class="active"' : '';
            return '<li><a href="' + esc(it.href) + '"' + cls + '>' + esc(it.label) + '</a></li>';
        }).join('');

        var brandHtml =
            '<a class="nav-brand" href="' + esc(BRAND.href) + '">' +
                (BRAND.logo ? '<span class="logo">' + esc(BRAND.logo) + '</span>' : '') +
                '<span>' + esc(BRAND.text) + '</span>' +
            '</a>';

        var searchHtml = SEARCH
            ? '<div class="nav-search"><span class="ico">🔍</span>' +
              '<input id="appNavSearch" type="search" placeholder="" autocomplete="off" aria-label="搜索"></div>'
            : '';

        var menuHtml = MENU
            ? '<button class="nav-toggle" type="button" aria-label="打开菜单" aria-expanded="false">☰</button>' +
              '<ul class="nav-links" id="appNavLinks">' + items + '</ul>'
            : '';

        host.outerHTML = '<nav class="app-nav">' + brandHtml + searchHtml + menuHtml + '</nav>';
        document.body.classList.add('has-nav');

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
        }
    }

    /* ---------- 入口 ---------- */
    function build() {
        var host = document.getElementById('app-nav');
        if (!host) { return; }
        if (SIDEBAR) {
            buildSidebar(host);
        } else {
            buildTopbar(host, activeIndex());
        }
        if (SEARCH) { bindSearch(); }
        if (CLOCK)  { bindClock(); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
