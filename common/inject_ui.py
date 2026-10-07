# -*- coding: utf-8 -*-
"""看板 HTML：统一导航注入 + 资源版本号管理

用法:
    python inject_ui.py <html...>                 # 注入导航（已存在则同步版本号）
    python inject_ui.py --check <html...>         # 只检查不修改
    python inject_ui.py --bump <版本> <html...>   # 只升版本号（不改结构）

说明:
    - 引用 /common/style.css 和 /common/nav.js 时自动带 ?v=<VER>
    - 改了 CSS/JS 之后跑一次 --bump 2，线上浏览器就会立刻拉新版（绕过缓存）
"""
import sys, os, re, io

VER = "1"

MARK_CSS = '/common/style.css'
MARK_JS  = '/common/nav.js'
MARK_NAV = 'id="app-nav"'

# 匹配 /common/style.css 或 /common/nav.js（含已有 ?v=...）
RE_VER = re.compile(r'(/common/(?:style\.css|nav\.js))(\?v=[0-9A-Za-z._\-]*)?')

RE_HEAD = re.compile(r'</head>', re.I)
RE_BODY = re.compile(r'<body[^>]*>', re.I)


def css_tag(ver=VER):
    return '<link rel="stylesheet" href="/common/style.css?v=%s">' % ver


def nav_block(ver=VER):
    return ('<div id="app-nav"></div>\n'
            '<script src="/common/nav.js?v=%s"></script>' % ver)


def bump_versions(html, ver):
    """把已有的 ?v= 全部改成新版本；没带版本号的补上"""
    n = [0]

    def rep(m):
        n[0] += 1
        return '%s?v=%s' % (m.group(1), ver)

    html = RE_VER.sub(rep, html)
    return html, n[0]


def inject(html, ver=VER):
    notes = []

    # ① CSS
    if MARK_CSS in html:
        notes.append('CSS 引用已存在')
    else:
        m = RE_HEAD.search(html)
        if m:
            html = html[:m.start()] + css_tag(ver) + '\n' + html[m.start():]
            notes.append('CSS 已注入')
        else:
            notes.append('⚠️ 没找到 </head>，CSS 未注入')

    # ② 导航
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

    # ③ 统一版本号
    html, cnt = bump_versions(html, ver)
    notes.append('版本号 → v%s（处理 %d 处）' % (ver, cnt))

    return html, notes


def main():
    args = sys.argv[1:]
    mode = 'inject'
    ver = VER
    if args and args[0] == '--check':
        mode = 'check'; args = args[1:]
    elif args and args[0] == '--bump':
        mode = 'bump'; args = args[1:]
        if not args:
            print('用法: inject_ui.py --bump <版本> <html...>'); return
        ver = args[0]; args = args[1:]

    if not args:
        print('用法: inject_ui.py [--check|--bump <ver>] <html...>'); return

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

        if mode == 'bump':
            new, cnt = bump_versions(html, ver)
            notes = ['版本号 → v%s（处理 %d 处）' % (ver, cnt)]
        else:
            new, notes = inject(html, ver)

        label = {'inject': '注入', 'check': '检查', 'bump': '升版本'}[mode]
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
