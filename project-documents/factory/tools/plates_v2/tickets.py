R='/home/claude/fifa17-career-showdown2/project-documents/factory/tickets/'
GH='https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/tickets/attach/'
BANS={'LEAGUE': 'no wheel, no ring, no dial, no football, no league names and no league symbols', 'CLUB': 'no club badges, no crests and no cards', 'STATISTICS': 'no charts, no tables and no numbers', 'RIVALRY': 'no charts, no scoreboards and no numbers', 'LEGACY': 'no timeline, no cards and no numbers', 'TROPHY_ROOM': 'no trophy or cup on the centre pedestal, no tabs and no labels', 'SETTINGS': 'no switches, no panels and no lists', 'FINAL_WINNER': 'no trophy or cup on the centre pedestal, no scoreboard and no names', 'RULE_BOOK': 'no open rule book, no pages and no lists', 'STANDINGS': 'no league table, no rows and no numbers', 'HOME': 'no tiles, no music card and no logo', 'CONNECT_PLAYERS': 'no player cards and no buttons', 'SEASON_RESULTS': 'no result cards, no scores and no buttons', 'TRANSFER': 'no hanging timer sign, no cards and no numbers'}
S=[
(1,'HOME','Home','the luxury stadium lounge: black marble pillars with gold light, leather sofas and the marble table with the gold football on the left, the floor-to-ceiling windows with the night stadium and green pitch behind, and the polished black marble floor at the front',True,''),
(2,'CONNECT_PLAYERS','Connect Players','the black-marble tunnel with gold-lit pillars, the lit stadium at the far end and the reflective black marble floor',True,''),
(3,'SEASON_RESULTS','Season Results','the night stadium with floodlights, crowd bokeh and gold-lit stands, and the black marble stage at the front',True,''),
(4,'TRANSFER','Transfer War','the luxury office: the night city and stadium through the tall windows, dark wood and gold walls, and the black marble desk with its books, lamps and papers. The hanging sign at the top centre is removed completely: show the window and night city there',True,''),
(5,'LEAGUE','Select League','the golden night stadium with floodlights, crowd bokeh and gold banners, and the polished black marble floor. The black marble plinth in the centre stays, with a flat empty top and nothing standing on it',True,''),
(6,'CLUB','Club Assignment','the dark gold-lit lounge with the stadium seen through the glass behind, the trophy shelves and leather chairs, and the black marble floor. Both men keep holding their black club packs; where each round badge was, continue the plain black pack surface',True,''),
(7,'STATISTICS','Career Statistics','the dark luxury lounge with gold bokeh lights, glass shelves with gold footballs, leather chairs and the black marble table at the front',True,''),
(8,'RIVALRY','Rivalry Statistics','the golden night stadium with floodlights, crowd bokeh and gold banners, and the dark polished floor',True,''),
(9,'LEGACY','Legacy','the black-marble trophy hall with tall arches, lit glass display cases with trophies and shirts, and the polished black marble floor',True,''),
(10,'TROPHY_ROOM','Trophy Room','the black-marble trophy hall with lit glass display cases along both walls, rope barriers, the red carpet and the polished floor. The black marble pedestal in the centre stays, with a flat empty top and nothing standing on it',True,''),
(11,'SETTINGS','Settings','the luxury penthouse lounge: black marble walls with gold veins, gold shelves with trophies and books, the night city through the windows, leather sofas and the marble table',False,''),
(12,'FINAL_WINNER','Final Winner','the golden stadium stage with floodlights, falling gold confetti, banners and black marble columns, and the steps. The black marble pedestal in the centre stays, with a flat empty top and nothing standing on it',True,''),
(13,'RULE_BOOK','Rule Book','the gold-lit library: tall bookshelves, black marble columns, leather chairs, a globe, and the marble floor',False,' On the right banner the words must read DIFFERENT MANAGERS SAME PASSION (the last word is PASSION, not AMBITION).'),
(14,'STANDINGS','Standings','the gold-framed arena with the night stadium, green pitch and floodlights behind, and the round black marble stage at the front',True,''),
]
for n,k,name,scene,people,extra in S:
    who=("Keep everything that is not cyan exactly as it is: the same two men, same faces, same hair, same hands, same pose, same clothes, same framing; Daniel stays on the LEFT and Nik on the RIGHT, never flipped. Where a man's body was covered, continue his clothes naturally. Show both men's full heads and all their hair."
         if people else "Keep everything that is not cyan exactly as it is. Add no people.")
    chk=("   - Daniel (left) and Nik (right) are still there, in the same place and pose, not flipped (Claude puts the exact faces back afterwards)\n" if people else "   - no people anywhere\n")
    t=f"""# Ticket 1610P · {n} of 14 · {name} clean background (plate V2)

One image only. The result must be an EMPTY background: the room and the two men, with no title, no cards, no buttons, no top bar and no words of the game at all. The live game draws all of those itself on top.

1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat; it cannot make pictures). Use a brand-new chat for every ticket, never one that already made a Showdown picture.
2. Attach this one file only: **GUIDE_{k}_PLATE_V2.png** (the picture with solid cyan boxes). On iPhone open {GH}GUIDE_{k}_PLATE_V2.png in Safari, press and hold the picture, then Save to Photos. Do not attach the finished NEXT picture. The right file shows big solid cyan boxes; if you see the finished screen with its title and buttons, it is the wrong file.
3. Paste the prompt below exactly. If ChatGPT asks a question or offers to change it, reply: `No, use my prompt exactly.`
4. Check the picture:
   - NO title, NO cards or panels, NO buttons, NO top bar or tabs, NO game words anywhere (if any of these came back, it fails)
   - no cyan left anywhere
{chk}   - the repainted parts blend in: no box edge, smear or colour step
   - black bars at the top and bottom, picture not cropped
5. If it passes, download it and drop it into Claude's factory thread with the words `1610P {k}`. If it fails, paste the fix line below once in the same chat; if it still fails, start again in a brand-new chat (up to 3 tries). Never send a picture that fails.

Fix line (paste once if needed):

```
Wrong: you drew the game screen again. I need ONLY the empty background. Take my attached picture and replace each cyan box with the room behind it. No title, no cards, no panels, no buttons, no top bar, no words, and {BANS[k]}. Keep everything else exactly as it is.
```

Prompt:

```
I am attaching a picture that has solid cyan boxes on it. Make a clean BACKGROUND PLATE from it: paint over each cyan box with the scenery that would be behind it, so the boxes disappear.

The result must be an empty background with NO user interface: no title or logo text, no cards, no panels, no frames, no buttons, no menus, no tabs, no top bar, no scoreboards, no numbers and no words of any kind inside the old cyan areas. The cyan boxes hide game parts that I removed on purpose: do not guess what was under them and never draw them back. Do not recreate any game screen. Do not add new people.

What belongs inside the cyan areas: {scene}. Continue the existing perspective and the warm golden lighting, premium and cinematic, sharp and detailed. Never draw inside the old cyan areas: {BANS[k]}. {who}{extra} No cyan may remain. Keep the black bars at the top and bottom pure black and keep the same framing.
```
"""
    open(R+f'TICKET-1610P_{n}_OF_14_{k}_PLATE.md','w').write(t)
print('ok')
