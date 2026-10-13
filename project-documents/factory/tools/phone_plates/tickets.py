# Job 1801 (HO-026): one ticket per clean marble phone background ENV_<KEY>_PHONE_V2, made from GUIDE_<KEY>_PHONE_V2 (cyan boxes).
R='/home/claude/fifa17-career-showdown2/project-documents/factory/tickets/'
GH='https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/tickets/attach/'
JOB=1801
BANS={'LEAGUE':'no wheel, no ring, no dial, no football, no league names and no league symbols','CLUB':'no club badges, no crests, no cards and no words on the packs','STATISTICS':'no charts, no tables and no numbers','RIVALRY':'no charts, no scoreboards and no numbers','LEGACY':'no cards, no badges and no numbers','TROPHY_ROOM':'no trophy or cup on the centre pedestal, no tabs, no display grid and no labels','SETTINGS':'no panels, no switches and no lists','FINAL_WINNER':'no trophy or cup on the centre pedestal, no scoreboard and no names','RULE_BOOK':'no open rule book, no pages and no lists','STANDINGS':'no league table, no rows, no badges and no numbers','HOME':'no tiles, no music card, no logo and no tab bar','CONNECT_PLAYERS':'no player cards, no tabs and no buttons','SEASON_RESULTS':'no title banner, no result cards, no scores and no buttons','TRANSFER':'no title sign, no cards, no timer and no numbers','LOADING':'no footballer or any person, no logo, no badge, no title and no words'}
# Full length (Nik asked 12 Oct 9:23 p.m. Eastern, Claude's call): the game lays its own panels over the lower half,
# so a whole man never shows a cut line in a gap or on a taller phone. Where a centre plinth or pedestal stays, the men stand behind it.
STAND={'TRANSFER':' Exception: both men stay seated behind the desk exactly as they are; the desk hides their legs naturally.',
'LEAGUE':' Both men stand BEHIND the round marble plinth: the plinth is in front of them and hides their lower legs, and its flat top stays empty and fully visible.',
'TROPHY_ROOM':' Both men stand behind and to the sides of the centre pedestal: the pedestal stays in front of them, fully visible, with its flat top empty.',
'FINAL_WINNER':' Both men stand behind and to the sides of the centre pedestal: the pedestal stays in front of them, fully visible, with its flat top empty.'}
S=[
('HOME','Home','the luxury marble lounge: black marble pillars with gold light, leather sofas, the night stadium through the tall windows and the polished black marble floor',True,''),
('CONNECT_PLAYERS','Connect Players','the black-marble tunnel with gold-lit pillars, the lit stadium at the far end and the reflective black marble floor',True,''),
('SEASON_RESULTS','Season Results','the night stadium with floodlights and gold-lit stands, and the black marble stage and floor at the front',True,''),
('TRANSFER','Transfer War','the luxury office: the night city and stadium through the tall windows, dark wood and gold, and the black marble desk running into the polished marble floor',True,''),
('LEAGUE','Select League','the golden night stadium with floodlights, crowd bokeh and gold banners, and the polished black marble floor. The round black marble plinth in the centre stays, with a flat empty top and nothing standing on it',True,''),
('CLUB','Club Assignment','the dark gold-lit marble lounge with the stadium seen through the glass behind and the black marble floor. Both men keep holding their black club packs; where each round badge and label was, continue the plain black pack surface',True,''),
('STATISTICS','Career Statistics','the dark luxury lounge with gold bokeh lights, glass shelves with gold footballs, leather chairs and the night city through the windows',True,''),
('RIVALRY','Rivalry Statistics','the golden night stadium with floodlights, crowd bokeh and gold banners, and the dark polished floor',True,''),
('LEGACY','Legacy','the black-marble trophy hall with tall arches, lit glass display cases with trophies and the polished black marble floor',True,''),
('TROPHY_ROOM','Trophy Room','the black-marble trophy hall with lit glass display cases along both walls and the polished floor. The black marble pedestal in the centre stays, with a flat empty top and nothing standing on it',True,''),
('SETTINGS','Settings','the luxury penthouse lounge: black marble walls with gold veins, gold shelves with trophies and books, the night city through the windows, leather sofas and the marble floor',False,''),
('FINAL_WINNER','Final Winner','the golden stadium stage with floodlights, falling gold confetti and black marble columns, and the steps. The black marble pedestal in the centre stays, with a flat empty top and nothing standing on it',True,''),
('RULE_BOOK','Rule Book','the gold-lit library: tall bookshelves, black marble columns, lamps and the polished marble floor',False,''),
('STANDINGS','Standings','the gold-framed arena with the night stadium, green pitch and floodlights behind, and the polished black marble floor',True,''),
('LOADING','Loading','the black-marble tunnel with gold veins and gold-lit rails on both sides, the lit stadium and green pitch at the far end, and the reflective black marble floor. The tunnel is empty: nobody stands in it',False,''),
]
n=len(S); rows=[]
for i,(k,name,scene,people,extra) in enumerate(S,1):
    who=("Keep everything that is not cyan exactly as it is: the same two men, same faces, same hair, same hands, same pose, same clothes, same framing, same natural lighting as the picture (never dimmed); Daniel stays on the LEFT and Nik on the RIGHT, never flipped. Show both men FULL LENGTH, standing on the floor: where a cyan box covers part of a man, continue his body, suit, trousers and shoes naturally down to the floor. Never cut a man off at the waist or in a straight line, and never fade him out. Show both men's full heads and all their hair."+STAND.get(k,'')
         if people else "Keep everything that is not cyan exactly as it is. Add no people.")
    chk=("   - Daniel (left) and Nik (right) are still there, same place and pose, not flipped, not dimmed (Claude puts the exact faces back afterwards)\n" if people else "   - no people anywhere\n")
    MEN=', and both men are full length down to their shoes (or naturally behind the plinth or desk), never cut off in a straight line or faded out' if people else ''
    t=f"""# Ticket {JOB} · {i} of {n} · {name} clean phone background (ENV_{k}_PHONE_V2)

One image only. The result must be an EMPTY tall phone background: the room{' and the two men' if people else ''}, with no title, no cards, no buttons, no tab bar and no words of the game at all. The live game draws all of those itself on top. (Hand-off HO-026: the phone screens get the exact marble look of your approved PHONE_{k}_MARBLE picture.)

1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat; it cannot make pictures). Use a brand-new chat for every ticket.
2. Attach this one file only: **GUIDE_{k}_PHONE_V2.png** (the tall picture with solid cyan boxes). On iPhone open {GH}GUIDE_{k}_PHONE_V2.png in Safari, press and hold the picture, then Save to Photos. The right file shows big solid cyan boxes; if you see the finished screen with its title and buttons, it is the wrong file.
3. Paste the prompt below exactly. If ChatGPT asks a question or offers to change it, reply: `No, use my prompt exactly.`
4. Check the picture:
   - NO title, NO cards or panels, NO buttons, NO tab bar, NO game words anywhere (if any of these came back, it fails)
   - no cyan left anywhere
{chk}   - the repainted parts blend in: no box edge, smear or colour step{MEN}
   - tall phone shape, same framing, not cropped
5. If it passes, download it and drop it into Claude's factory thread with the words `{JOB} {k}`. If it fails, paste the fix line below once in the same chat; if it still fails, start again in a brand-new chat (up to 3 tries).

Fix line (paste once if needed):

```
Wrong: you drew the game screen again. I need ONLY the empty background. Take my attached picture and replace each cyan box with the room behind it. No title, no cards, no panels, no buttons, no tab bar, no words, and {BANS[k]}. Keep everything else exactly as it is.
```

Prompt:

```
I am attaching a tall phone picture that has solid cyan boxes on it. Make a clean BACKGROUND PLATE from it: paint over each cyan box with the scenery that would be behind it, so the boxes disappear.

The result must be an empty background with NO user interface: no title or logo text, no cards, no panels, no frames, no buttons, no menus, no tabs, no tab bar, no scoreboards, no numbers and no words of any kind inside the old cyan areas. The cyan boxes hide game parts that I removed on purpose: do not guess what was under them and never draw them back. Do not recreate any game screen. Do not add new people.

What belongs inside the cyan areas: {scene}. Continue the existing perspective and the warm golden lighting of black marble with gold veins, premium and cinematic, sharp and detailed. No blue tint, no glass panels, no neon. Never draw inside the old cyan areas: {BANS[k]}. {who}{extra} No cyan may remain. Keep the same tall phone shape and the same framing.
```
"""
    fn=f'TICKET-{JOB}_{i}_OF_{n}_{k}_PHONE_PLATE.md'
    open(R+fn,'w').write(t); rows.append(f'| {i} | {name} | {fn} |')
open(R+f'TICKET-{JOB}_README.md','w').write(f"""# Ticket {JOB}: clean marble phone backgrounds (HO-026)

Same method as the 14 desktop backgrounds (1610P): each guide is Nik's approved PHONE_<KEY>_MARBLE picture with solid cyan boxes over every game part; GPT paints the room behind the boxes. Claude then puts the exact approved pixels back outside the boxes (likeness lock) and saves `visual-assets/v10_1/plates-v2/ENV_<KEY>_PHONE_V2.webp` (1179x2096). Loading is the empty tunnel: the live game layers the real licensed Marco Reus photo on top (Nik, 12 Oct). Trophy Room single uses the Trophy Room background; Settings uses one background for both parts.

| # | Screen | Ticket |
| --- | --- | --- |
"""+'\n'.join(rows)+'\n')
print('ok')
