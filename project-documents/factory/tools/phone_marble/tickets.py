# HO-026 (r75): PHONE_<KEY>_MARBLE mockup tickets. Picture 1 = approved PHONE_<KEY> layout, picture 2 = NEXT_<KEY> marble look.
import os
R=os.path.join(os.path.dirname(__file__),'..','..','tickets')+'/'
GH='https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/mockups/'
JOB=1799
TABS='At the very bottom keep the tab bar exactly as in picture 1: HOME (house icon), CAREER (trophy icon), STANDINGS (three lines icon), STATS (bar chart icon), RULES (page icon), HOME highlighted. '
S=[
('HOME','Home','the luxury marble lounge of picture 2: black marble pillars with gold light, leather sofas, the night stadium through the tall windows',
 'SIGN IN | NO ACTIVE SHOWDOWN | THE RIVALRY STARTS HERE | CAREER MODE SHOWDOWN 17 | TWO MANAGERS · ONE LEGACY | CAREER | CONTINUE CAREER | START A SHOWDOWN | LEGACY | STATISTICS | TROPHY ROOM | RULE BOOK | SETTINGS | AUDIUS SOUNDTRACK | PLAY TRACK | MUTE | TRACKS | HOME | CAREER | STANDINGS | STATS | RULES',
 'Keep the round gear button at the top right. The SIGN IN button must stay at the top left. '+TABS),
('SEASON_RESULTS','Season Results','the night stadium with floodlights and gold-lit stands of picture 2, and its black marble stage',
 'SEASON RESULTS | DANIEL | NIK | SEALED | HOW SCORING WORKS | Daniel | Arsenal | LEAGUE POSITION | 1 | LEAGUE POINTS | 86 | LEAGUE GOALS | 92 | Domestic Cup Winner | Champions League Winner | Top Scorer | Top Assist | REVIEW MY SEASON RESULT | BACK TO SHOWDOWN HOME',
 'The two men wear their black suits from picture 2, not football shirts. There is no tab bar on this screen; do not add one. '),
('FINAL_WINNER','Final Winner','the golden stadium stage of picture 2 with floodlights, falling gold confetti and black marble columns',
 'CAREER MODE SHOWDOWN 17 | SHOWDOWN CHAMPION | TWO MANAGERS · ONE LEGACY | SHARED SHOWDOWN CLOSED | DANIEL WINS | DANIEL | 16 | NIK | 8 | SUMMARY | HONOURS | FINAL SEASON 3 | 6 – 0 | DANIEL TAKES THE SEASON | SEASONS | 3 | PLAYED | MARGIN | 8 | POINTS | REVIEW MY SEASON RESULT | BACK TO SHOWDOWN HOME',
 'Keep the gold cup between the two men exactly as in picture 1. There is no tab bar on this screen; do not add one. '),
]
n=len(S)
rows=[]
for i,(k,name,scene,words,extra) in enumerate(S,1):
    t=f"""# Ticket {JOB} · {i} of {n} · {name} phone mockup in the marble look (PHONE_{k}_MARBLE)

One image only. It is a tall phone picture of the {name} screen: the same layout as today's phone picture, redrawn in the black-and-gold marble look of the desktop picture. Nik approves it; then Team G builds the phone screen to match (hand-off HO-026, r75).

1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat; it cannot make pictures). Use a brand-new chat for every ticket.
2. Attach these two files, in this order. On iPhone open each link in Safari, press and hold the picture, then Save to Photos.
   - Picture 1 (the layout): **PHONE_{k}.png** {GH}PHONE_{k}.png
   - Picture 2 (the look and the two men): **NEXT_{k}.png** {GH}NEXT_{k}.png
3. Paste the prompt below exactly. If ChatGPT asks a question or offers to change it, reply: `No, use my prompt exactly.`
4. Check the picture:
   - tall phone shape, same layout as picture 1: every title, card, button and word in the same place
   - every word is spelled exactly as in the word list (no new words, no missing words)
   - the look is the black marble with gold veins and polished gold of picture 2; no stadium-night blue, no glass panels, no neon
   - Daniel (curly hair, white shirt) on the LEFT and Nik (beard, black shirt) on the RIGHT, faces like picture 2
   - no new buttons, tabs, icons or people
5. If it passes, download it and drop it into Claude's factory thread with the words `{JOB} {k}`. If it fails, paste the fix line below once in the same chat; if it still fails, start again in a brand-new chat (up to 3 tries).

Fix line (paste once if needed):

```
Wrong. Keep picture 1's layout and every word exactly, letter for letter, and only change the look to picture 2's black-and-gold marble. Same two men as picture 2, Daniel on the left. No new words, buttons, tabs or icons.
```

Prompt:

```
MOST IMPORTANT: only use words that are already in picture 1, letter for letter. Do not invent any text, rule, tab, button, icon or number. Never add SQUAD, TRANSFERS, COMPETITIONS, COMPETE, PROFILE, SHOP, a bell, an avatar or a search icon. Do not move any button, tab or icon.

I am attaching two pictures. Picture 1 is a tall phone screen of a football career game. Picture 2 is the desktop version of the same screen in its final premium look.

Redraw picture 1 as a tall phone screen in the exact look of picture 2. Keep picture 1's layout exactly: the same title, cards, buttons, tabs and words, in the same places and sizes, in the same tall shape. Change only the look: use picture 2's black marble with gold veins, polished brushed gold frames and warm controlled gold light, and set the screen in {scene}. The cards become black marble and black lacquer panels with thin gold edges, like picture 2. The main button is polished gold. No glass panels, no neon, no blue stadium-night tint and no new effects.

The two men must look exactly like picture 2: same faces, hair, beards and black suits (Daniel has curly hair and a white shirt, Nik has a beard and a black shirt). Daniel stays on the LEFT and Nik on the RIGHT, never flipped. Show both men's full heads and all their hair. {extra}

Words on this screen, exactly as written: {words}
```
"""
    fn=f'TICKET-{JOB}_{i}_OF_{n}_PHONE_{k}_MARBLE.md'
    open(R+fn,'w').write(t); rows.append(f'| {i} | {name} | {fn} |')
open(R+f'TICKET-{JOB}_README.md','w').write(f"""# Ticket {JOB}: marble phone mockups, first 3 samples (HO-026, r75)

Nik's decision (12 Oct 2026): phone, sideways and tablet use exactly the desktop marble look. These three samples come first; the other 11 screens, Loading and Trophy Room single follow the same ticket once the samples are approved. Each result is saved as `mockups/PHONE_<KEY>_MARBLE.png` (the old PHONE_<KEY>.png stays). Then the 1610P cyan-box method makes the plate `ENV_<KEY>_PHONE_V2`.

| # | Screen | Ticket |
| --- | --- | --- |
"""+'\n'.join(rows)+'\n')
print('ok')
