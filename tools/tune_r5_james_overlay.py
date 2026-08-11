from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'css' / 'footballVisuals.css'
text = path.read_text(encoding='utf-8')
old = '''.footballVisualPanel[data-tone="light"]::before{
    background:
        linear-gradient(104deg,rgba(246,249,249,.98) 0 36%,rgba(241,246,247,.78) 48%,rgba(229,239,242,.12) 67%,transparent 78%),
        linear-gradient(0deg,rgba(238,244,245,.64) 0,transparent 42%);
}'''
new = '''.footballVisualPanel[data-tone="light"]::before{
    background:
        linear-gradient(104deg,rgba(246,249,249,.94) 0 18%,rgba(241,246,247,.42) 34%,rgba(229,239,242,.08) 52%,transparent 66%),
        linear-gradient(0deg,rgba(238,244,245,.30) 0,transparent 38%);
}'''
if new in text:
    print('James light-tone overlay already tuned')
elif old in text:
    path.write_text(text.replace(old, new), encoding='utf-8')
    print('Reduced inherited r4 light-tone wash over James photograph')
else:
    raise RuntimeError('Expected light-tone overlay block not found')
