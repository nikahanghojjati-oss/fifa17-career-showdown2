# Relight every HC room (desktop 2X, phone, tall). Run from the folder that holds rooms/ (V2 inputs) and out/.
cd "$(dirname "$0")/.."
cfg(){ python3 -c "import json;d=json.load(open('tools/lamps.json'))['$1'];print(json.dumps([d['dan'],d['nik']]))"; }
run(){ python3 -I tools/run_room.py "$@" >/dev/null && echo ok $2; }
run rooms/tunnel_2x.webp out/tunnel_2x.png "$(cfg tunnel)" &
run rooms/box_2x.webp out/box_2x.png "$(cfg box)" &
run rooms/board_2x.webp out/board_2x.png "$(cfg board)" & wait
run rooms/archive_2x.webp out/archive_2x.png "$(cfg archive)" &
run rooms/home_2x.webp out/home_2x.png "$(cfg home)" &
run rooms/office_2x.webp out/office_2x.png "$(cfg office)" '[[960,260,250,270],[1960,250,260,290]]' & wait
run rooms/ENV_HALL_PLATE_HC_V2_2X.webp out/hall_2x.png "$(cfg hall)" &
run rooms/ENV_COACHES_PLATE_HC_V2_2X.webp out/coaches_2x.png "$(cfg coaches)" &
run rooms/tunnel_ph.webp out/tunnel_ph.png "$(cfg tunnel)" & wait
run rooms/box_ph.webp out/box_ph.png "$(cfg box)" &
run rooms/box_tall.webp out/box_tall.png "$(cfg box)" &
run rooms/board_ph.webp out/board_ph.png "$(cfg board)" & wait
run rooms/archive_ph.webp out/archive_ph.png "$(cfg archive)" &
run rooms/home_ph.webp out/home_ph.png "$(cfg home)" &
run rooms/office_ph.webp out/office_ph.png "$(cfg office)" '[[275,375,110,115],[835,385,115,125]]' & wait
run rooms/ENV_HALL_PHONE_HC_V2.webp out/hall_ph.png "$(cfg hall)" &
run rooms/ENV_HALL_PHONE_HC_V2_TALL.webp out/hall_tall.png "$(cfg hall)" & wait
run rooms/ENV_COACHES_PHONE_HC_V2.webp out/coaches_ph1.png "$(cfg coaches_phone)" &
run rooms/ENV_COACHES_PHONE_HC_V2_TALL.webp out/coaches_tall1.png "$(cfg coaches_phone)" & wait
python3 -I tools/halo.py out/coaches_ph1.png out/coaches_ph.png 819 "$(cfg coaches_phone)" >/dev/null && echo ok halo ph
python3 -I tools/halo.py out/coaches_tall1.png out/coaches_tall.png 1100 "$(cfg coaches_phone)" >/dev/null && echo ok halo tall
