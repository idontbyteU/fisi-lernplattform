#!/usr/bin/env python3
"""Pre-push JS syntax check for the FISI//OS static site.

Scans every <script> block in every *.html file at the repo root and reports
REAL JavaScript syntax errors — specifically the classes that have bitten this
project before:

  * a German „…" string where the closing quote is a straight ASCII " — this
    terminates a double-quoted JS string early (the QUIZZES expl bug);
  * a literal </script> inside a JS string, which makes the HTML parser end the
    <script> element early (the XSS-card bug);
  * any other unterminated " / ' string or regex literal.

It is a focused lexer (string / comment / template / regex aware), not a full
parser: the decisive rule is that a " or ' string literal hitting a newline is
unterminated. Run it before pushing:

    python tools/js_scan.py

Exit code is 0 when all files are clean, 1 when any real error is found.
"""
import re, glob, os, sys

def mask_non_script(src):
    # blank everything (keep newlines), then restore <script> bodies so line numbers stay aligned
    out = list(re.sub(r'[^\n]', ' ', src))
    for m in re.finditer(r'<script\b[^>]*>(.*?)</script>', src, re.I | re.S):
        for k in range(m.start(1), m.end(1)):
            out[k] = src[k]
    return ''.join(out)

KW = ('return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
      'do', 'else', 'yield', 'case')

def regex_allowed(prevtok):
    if prevtok == '':
        return True
    if prevtok in KW:
        return True
    return prevtok[-1] in '(,=:[!&|?{};~+-*/%^<>'

def scan(src):
    errors = []
    i, n, line = 0, len(src), 1
    mode = 'normal'
    sline = rline = 0
    in_class = False
    prevtok = ''
    tmpl = []  # brace depth stack for ${ } inside template literals
    while i < n:
        c = src[i]
        if mode == 'normal':
            if c == '\n':
                line += 1; i += 1; continue
            if c == '/' and i + 1 < n and src[i + 1] == '/':
                mode = 'lc'; i += 2; continue
            if c == '/' and i + 1 < n and src[i + 1] == '*':
                mode = 'bc'; i += 2; continue
            if c == '"':
                mode = 'dq'; sline = line; i += 1; continue
            if c == "'":
                mode = 'sq'; sline = line; i += 1; continue
            if c == '`':
                mode = 'tmpl'; i += 1; continue
            if c == '/' and regex_allowed(prevtok):
                mode = 'regex'; rline = line; in_class = False; i += 1; continue
            if c == '}' and tmpl and tmpl[-1] == 0:
                tmpl.pop(); mode = 'tmpl'; i += 1; continue
            if c == '{':
                if tmpl: tmpl[-1] += 1
                prevtok = '{'; i += 1; continue
            if c == '}':
                if tmpl: tmpl[-1] -= 1
                prevtok = '}'; i += 1; continue
            if c.isalnum() or c == '_' or c == '$':
                j = i
                while j < n and (src[j].isalnum() or src[j] in '_$'):
                    j += 1
                prevtok = src[i:j]; i = j; continue
            if not c.isspace():
                prevtok = c
            i += 1; continue
        if mode in ('dq', 'sq'):
            q = '"' if mode == 'dq' else "'"
            if c == '\\':
                i += 2; continue
            if c == '\n':
                errors.append((sline, 'unterminated ' + ('double' if mode == 'dq' else 'single') + '-quoted string'))
                mode = 'normal'; line += 1; i += 1; continue
            if c == q:
                mode = 'normal'; prevtok = q; i += 1; continue
            i += 1; continue
        if mode == 'tmpl':
            if c == '\\':
                i += 2; continue
            if c == '\n':
                line += 1; i += 1; continue
            if c == '`':
                mode = 'normal'; prevtok = '`'; i += 1; continue
            if c == '$' and i + 1 < n and src[i + 1] == '{':
                tmpl.append(0); mode = 'normal'; i += 2; continue
            i += 1; continue
        if mode == 'lc':
            if c == '\n':
                mode = 'normal'; line += 1; i += 1; continue
            i += 1; continue
        if mode == 'bc':
            if c == '\n':
                line += 1; i += 1; continue
            if c == '*' and i + 1 < n and src[i + 1] == '/':
                mode = 'normal'; i += 2; continue
            i += 1; continue
        if mode == 'regex':
            if c == '\\':
                i += 2; continue
            if c == '\n':
                errors.append((rline, 'unterminated regex'))
                mode = 'normal'; line += 1; i += 1; continue
            if c == '[':
                in_class = True; i += 1; continue
            if c == ']':
                in_class = False; i += 1; continue
            if c == '/' and not in_class:
                mode = 'normal'; prevtok = '/'; i += 1; continue
            i += 1; continue
    if mode in ('dq', 'sq'):
        errors.append((sline, 'unterminated string at EOF'))
    return errors

def main():
    # repo root = parent of this tools/ directory
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bad = 0
    for f in sorted(glob.glob(os.path.join(root, '*.html'))):
        name = os.path.basename(f)
        with open(f, encoding='utf-8') as fh:
            src = fh.read()
        errs = scan(mask_non_script(src))
        if errs:
            bad += 1
            print(f"\n=== {name} : {len(errs)} REAL JS SYNTAX ERROR(S) ===")
            for ln, msg in errs:
                print(f"   line {ln}: {msg}")
        else:
            print(f"OK   {name}")
    if bad:
        print(f"\nFAILED: {bad} file(s) with JS syntax errors.")
        return 1
    print("\nAll files clean.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
