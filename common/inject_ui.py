# -*- coding: utf-8 -*-
"""看板 HTML：统一导航注入 / 移除 + 资源版本号管理

用法:
    python inject_ui.py <html...>                 # 注入导航（已存在则同步版本号）
    python inject_ui.py --strip <html...>         # 移除导航和 common 引用（看板独立化）
    python inject_ui.py --check <html...>         # 只检查不修改
    python inject_ui.py --bump <版本> <html...>   # 只升版本号

背景:
    - 首页（个人工作台）需要导航
    - 各看板页面必须【完全独立】：不含任何导航/品牌/其他看板入口
      （各看板对接不同的人，不能互相看见）
"""
import sys, os, re, io

VER = "1"

MARK_CSS = '/common/style.css'
MARK_JS  = '/common/nav.js'
MARK_NAV = 'id="app-nav"'

RE_VER = re.compile(r'(/common/(?:style\.css|nav\.js))(\?v=[0-9A-Za-z._\-]*)?')

RE_HEAD = re.compile(r'</head>', re.I)
RE_BODY = re.compile(r'<body[^>]*>', re.I)

# 移除用
RE_NAV_DIV    = re.compile(r'\s*<div\s+id="app-nav"\s*>\s*</div>[ \t]*\n?', re.I)
RE_NAV_SCRIPT = re.compile(r'\s*<script[^>]*src="/common/nav\.js[^"]*"[^>]*>\s*</script>[ \t]*\n?', re.I)
RE_CSS_LINK   = re.compile(r'\s*<link[^>]*href="/common/style\.css[^"]*"[^>]*>[ \t]*\n?', re.I)


def css_tag(ver=VER):
    return '<link rel="stylesheet" href="/common/style.css?v=%s">' % ver


def nav_block(ver=VER):
    return ('<div id="app-nav"></div>\n'
            '<script src="/common/nav.js?v=%s"></script>' % ver)


def bump_versions(html, ver):
    n = [0]

    def rep(m):
        n[0] += 1
        return '%s?v=%s' % (m.group(1), ver)

    return RE_VER.sub(rep, html), n[0]


def inject(html, ver=VER):
    notes = []
    if MARK_CSS in html:
        notes.append('CSS 引用已存在')
    else:
        m = RE_HEAD.search(html)
        if m:
            html = html[:m.start()] + css_tag(ver) + '\n' + html[m.start():]
            notes.append('CSS 已注入')
        else:
            notes.append('⚠️ 没找到 </head>，CSS 未注入')

    if MARK_NAV in html:
        notes.append('导航已存在')
    else:
        m = RE_BODY.search(html)
        if m:
            i = m.end()
            html = html[:i] + '\n' + nav_block(ver) + '\n' + html[i:]
            notes.append('导航已注入')
        else:
            notes.append('⚠️ 没找到 <body>，导航未注入')

    html, cnt = bump_versions(html, ver)
    notes.append('版本号 → v%s（%d 处）' % (ver, cnt))
    return html, notes


def strip(html):
    """移除导航 + common 引用，让看板彻底独立"""
    notes = []
    total = 0
    for rx, name in ((RE_NAV_DIV, '导航容器'),
                     (RE_NAV_SCRIPT, 'nav.js 引用'),
                     (RE_CSS_LINK, 'style.css 引用')):
        html, k = rx.subn('\n', html)
        total += k
        if k:
            notes.append('%s 已移除 (%d)' % (name, k))
    # 清理连续空行
    html = re.sub(r'\n{3,}', '\n\n', html)
    if not notes:
        notes.append('本来就没有导航/引用，无需处理')
    notes.append('合计移除 %d 项' % total)
    return html, notes


def main():
    args = sys.argv[1:]
    mode = 'inject'
    ver = VER
    if args and args[0] == '--check':
        mode = 'check'; args = args[1:]
    elif args and args[0] == '--strip':
        mode = 'strip'; args = args[1:]
    elif args and args[0] == '--bump':
        mode = 'bump'; args = args[1:]
        if not args:
            print('用法: inject_ui.py --bump <版本> <html...>'); return
        ver = args[0]; args = args[1:]

    if not args:
        print('用法: inject_ui.py [--check|--strip|--bump <ver>] <html...>'); return

    for path in args:
        if not os.path.isfile(path):
            print('❌ 不存在: %s' % path)
            continue
        with io.open(path, 'r', encoding='utf-8', errors='replace') as f:
            html = f.read()
        before = html

        title = ''
        mt = re.search(r'<title>([^<]*)</title>', html, re.I)
        if mt:
            title = mt.group(1).strip()[:46]

        if mode == 'strip':
            new, notes = strip(html)
        elif mode == 'bump':
            new, cnt = bump_versions(html, ver)
            notes = ['版本号 → v%s（%d 处）' % (ver, cnt)]
        elif mode == 'check':
            is_indep = (MARK_NAV not in html) and (MARK_CSS not in html) and (MARK_JS not in html)
            notes = ['独立页面 ✅' if is_indep else '含导航/公共引用 ⚠️']
            new = html
        else:
            new, notes = inject(html, ver)

        label = {'inject': '注入', 'check': '检查', 'bump': '升版本', 'strip': '移除'}[mode]
        print('── %s: %s' % (label, path.replace('\\', '/').split('/')[-2:][0] + '/' + os.path.basename(path)))
        print('   title: %s' % title)
        for n in notes:
            print('   · %s' % n)

        if mode == 'check':
            print('   (未修改)')
        elif new != before:
            with io.open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(new)
            print('   ✅ 已写回')
        else:
            print('   ○ 无变化')
        print()


if __name__ == '__main__':
    main()
