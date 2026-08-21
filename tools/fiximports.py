"""Recomputes the import block of every module in src/ from what it actually
uses. Run after moving code between modules:  python3 tools/fiximports.py"""
import re, os, glob

def code_spans(s):
    spans, i, n, start = [], 0, len(s), 0
    while i < n:
        c, nxt = s[i], (s[i+1] if i+1 < n else "")
        if c == "/" and nxt == "/":
            spans.append((start, i)); j = s.find("\n", i); i = n if j < 0 else j; start = i
        elif c == "/" and nxt == "*":
            spans.append((start, i)); j = s.find("*/", i+2); i = n if j < 0 else j+2; start = i
        elif c in "'\"":
            spans.append((start, i)); q = c; i += 1
            while i < n and s[i] != q: i += 2 if s[i] == "\\" else 1
            i += 1; start = i
        elif c == "`":
            spans.append((start, i)); i += 1
            while i < n:
                if s[i] == "\\": i += 2; continue
                if s[i] == "`": i += 1; break
                if s[i] == "$" and i+1 < n and s[i+1] == "{":
                    i += 2; depth, sub = 1, i
                    while i < n and depth:
                        if s[i] == "{": depth += 1
                        elif s[i] == "}": depth -= 1
                        elif s[i] in "'\"`":
                            q = s[i]; i += 1
                            while i < n and s[i] != q: i += 2 if s[i] == "\\" else 1
                        i += 1
                    spans.append((sub, i-1)); continue
                i += 1
            start = i
        else:
            i += 1
    spans.append((start, n))
    return [(a, b) for a, b in spans if b > a]

ident = re.compile(r"\b[A-Za-z_$][A-Za-z0-9_$]*\b")
EXPORT = re.compile(r"(?m)^export (?:function|const|let|class)\s+([A-Za-z_$][\w$]*)")
IMPORTS = re.compile(r"(?m)^import .*?;\n")

files = sorted(glob.glob("src/*.js"))
bodies = {f: IMPORTS.sub("", open(f).read()).lstrip("\n") for f in files}
owner = {}
for f, text in bodies.items():
    for m in EXPORT.finditer(text):
        owner[m.group(1)] = os.path.basename(f)

changed = 0
for f, text in bodies.items():
    mine = os.path.basename(f)
    used = set()
    for a, b in code_spans(text):
        chunk = text[a:b]
        for m in ident.finditer(chunk):
            w = m.group(0)
            if w not in owner or owner[w] == mine: continue
            if chunk[:m.start()].rstrip().endswith("."): continue
            used.add(w)
    by_mod = {}
    for w in sorted(used): by_mod.setdefault(owner[w], []).append(w)
    header = "".join(f'import {{ {", ".join(v)} }} from "./{k}";\n' for k, v in sorted(by_mod.items()))
    out = (header + "\n" + text) if header else text
    if out != open(f).read():
        open(f, "w").write(out); changed += 1
    print(f"{mine:<16} imports {sum(len(v) for v in by_mod.values()):>3} names from {len(by_mod)} modules")
print(f"\n{changed} file(s) rewritten")
