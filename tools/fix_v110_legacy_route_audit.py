from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,t): (ROOT/p).write_text(t,encoding='utf-8')
def one(t,o,n,label):
    c=t.count(o)
    if c!=1: raise RuntimeError(f'{label}: expected 1 match, found {c}')
    return t.replace(o,n,1)

optional=read('js/optionalModules.js')
optional=one(optional,
'''        }else if(name === "legacy"){\n            showScreen("legacy");\n        }else if(name === "ruleBook"){''',
'''        }else if(name === "legacy"){\n            return showScreen("legacy");\n        }else if(name === "ruleBook"){''',
'propagate Legacy route result')
write('js/optionalModules.js',optional)

browser=read('tests/browser/backup-export-audit.cjs')
old='''        localStorage.setItem(activeKey, JSON.stringify({\n            id: 1700000000000,\n            name: "Browser Backup",\n            status: "Completed",\n            updatedAt: "2026-08-11T12:00:00.000Z",\n            completedAt: "2026-08-11T12:00:00.000Z"\n        }));\n        localStorage.setItem(legacyKey, JSON.stringify([{\n            id: 1700000000000,\n            name: "Browser Backup",\n            status: "Completed",\n            updatedAt: "2026-08-11T12:00:00.000Z",\n            completedAt: "2026-08-11T12:00:00.000Z"\n        }]));'''
new='''        const completed = {\n            id: 1700000000000,\n            schemaVersion: 2,\n            name: "Browser Backup",\n            status: "Completed",\n            managers: { playerOne: "Manager One", playerTwo: "Manager Two" },\n            selectedLeague: { id: "premier-league", name: "Premier League" },\n            clubs: { playerOne: "Chelsea", playerTwo: "Liverpool" },\n            rounds: [],\n            transferChallenges: [],\n            score: { playerOne: 3, playerTwo: 1 },\n            updatedAt: "2026-08-11T12:00:00.000Z",\n            completedAt: "2026-08-11T12:00:00.000Z"\n        };\n        localStorage.setItem(activeKey, JSON.stringify(completed));\n        localStorage.setItem(legacyKey, JSON.stringify([completed]));'''
browser=one(browser,old,new,'realistic completed backup seed')
write('tests/browser/backup-export-audit.cjs',browser)

print('Candidate A Legacy route/audit repair generated')
