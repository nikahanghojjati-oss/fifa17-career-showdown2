# K0: builds fixtures.json from production main (anchor 2de2373). Strings below are copied from
# js/clubAssignment.js (renderReadyAssignmentState, renderClubRevealStage, renderClubConfirmationState,
# populateClubConfirmation) and index.html #clubWheelScreen at that SHA; the script re-reads main and
# fails if any string is missing there, so the fixtures cannot drift from product truth.
import json, subprocess
MAIN = 'origin/main'
def show(p): return subprocess.run(['git', 'show', f'{MAIN}:{p}'], capture_output=True, text=True, check=True).stdout
src = show('js/clubAssignment.js') + show('index.html')

D, N, LEAGUE, CA, CB = 'Daniel', 'Nik', 'Premier League', 'Arsenal', 'Chelsea'
SHOWDOWN, SEASONS = 'Daniel vs Nik', 3
META = f'{LEAGUE} · {SEASONS} season{"" if SEASONS == 1 else "s"}'
LOCK = 'These clubs are permanent for the full showdown. Confirmation starts the rivalry and never rerolls either club.'
for s in ['LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY', 'CLUB DRAW SAVED · PREPARING PACK 01', '· PACK 01 OPEN',
          '· PACK 02 OPEN', 'BOTH CLUBS REVEALED · BUILDING RIVALRY', 'RIVALRY READY · CONFIRM TO BEGIN',
          'OPEN SHOWDOWN PACKS', 'DRAW LOCKED...', 'CONFIRM RIVALRY & START SHOWDOWN', LOCK, 'CLUBS LOCKED',
          'CAREER DRAW', 'ASSIGNED CLUB', 'SEALED', 'REVEALED', 'RIVALRY', 'LEAGUE CONFIRMED', '01 DRAW', '05 LOCK']:
    assert s in src, s

ctl = lambda show, dis, text=None: {'show': show, 'disabled': dis, **({'text': text} if text else {})}
frames = {
 'CL1': dict(stage='ready', status='LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY', revealed=[False, False], confirmation=False,
             open=ctl(True, False, 'OPEN SHOWDOWN PACKS'), confirm=ctl(False, True), back=ctl(True, False), primary='openClubPack'),
 'CL2': dict(stage='opening', status='CLUB DRAW SAVED · PREPARING PACK 01', revealed=[False, False], confirmation=False,
             open=ctl(True, True, 'DRAW LOCKED...'), confirm=ctl(False, True), back=ctl(False, True), primary=None),
 'CL3': dict(stage='manager-one', status=f'{D.upper()} · PACK 01 OPEN', revealed=[True, False], confirmation=False,
             open=ctl(True, True, 'DRAW LOCKED...'), confirm=ctl(False, True), back=ctl(False, True), primary=None),
 'CL4': dict(stage='manager-two', status=f'{N.upper()} · PACK 02 OPEN', revealed=[True, True], confirmation=False,
             open=ctl(True, True, 'DRAW LOCKED...'), confirm=ctl(False, True), back=ctl(False, True), primary=None),
 'CL5': dict(stage='versus', status='BOTH CLUBS REVEALED · BUILDING RIVALRY', revealed=[True, True], confirmation=True,
             open=ctl(False, True), confirm=ctl(False, True), back=ctl(False, True), primary=None),
 'CL6': dict(stage='confirmation', status='RIVALRY READY · CONFIRM TO BEGIN', revealed=[True, True], confirmation=True,
             open=ctl(False, True), confirm=ctl(True, False, 'CONFIRM RIVALRY & START SHOWDOWN'), back=ctl(False, True), primary='continueClubAssignment'),
}
chrome = ['CAREER MODE', 'SHOWDOWN // 17', 'SIGN IN', 'No Active Showdown', 'Career Mode Showdown', 'v1.9.1']
rail = ['01 DRAW', '02 PACK 1', '03 PACK 2', '04 VS', '05 LOCK']
for f in frames.values():
    e = chrome + ['CLUB ASSIGNMENT', 'LEAGUE CONFIRMED', LEAGUE, f['status']] + rail + ['RIVALRY', 'VS', '01', '02', D, N, 'CAREER DRAW', 'ASSIGNED CLUB']
    e += [CA if f['revealed'][0] else '?', 'REVEALED' if f['revealed'][0] else 'SEALED']
    e += [CB if f['revealed'][1] else '?', 'REVEALED' if f['revealed'][1] else 'SEALED']
    if f['confirmation']: e += ['CLUBS LOCKED', SHOWDOWN, META, D, CA, 'VS', N, CB, LOCK]
    for c in ('open', 'confirm'):
        if f[c]['show']: e.append(f[c]['text'])
    if f['back']['show']: e.append('BACK')
    f['expected'] = sorted(set(e))
json.dump({
 'source': {'main_anchor': '2de237391e17c7de2c6deb606b102b68ee640212', 'files': ['index.html#clubWheelScreen', 'js/clubAssignment.js', 'css/app.css']},
 'managers': {'playerOne': D, 'playerTwo': N}, 'league': LEAGUE, 'clubs': {'playerOne': CA, 'playerTwo': CB},
 'showdown': SHOWDOWN, 'totalRounds': SEASONS, 'meta': META, 'lockNote': LOCK,
 'header': {'onlinePlayerIdentityBadge': 'SIGN IN', 'seasonIndicator': 'No Active Showdown'},
 'decorative': ['CM 17', 'CAREER MODE SHOWDOWN 17', 'More Than A Game', 'FOOTBALL BRINGS US TOGETHER'],
 'optional_visible': {'desktop_only': ['More Than A Game', 'FOOTBALL BRINGS US TOGETHER'],
                      'phone_may_hide': rail + ['CAREER MODE', 'SHOWDOWN // 17', 'Career Mode Showdown', 'v1.9.1', 'CAREER MODE SHOWDOWN 17']},
 'frames': frames,
}, open('fixtures.json', 'w'), indent=1, ensure_ascii=False)
print('fixtures.json ok', list(frames))
