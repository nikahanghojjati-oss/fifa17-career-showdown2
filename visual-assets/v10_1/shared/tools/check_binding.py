#!/usr/bin/env python3
"""Validate Team V fixture shape against JOB-104 binding assumptions.

Part 1 validates Home, Start / Join, and Season Results. It intentionally
uses only the Python standard library. When Team G's G-11 manifest is copied
onto the factory branch, the same checker validates its declared screen roots.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

STATUSES = {"loading", "empty", "unavailable", "partial", "ready"}
HOME_REASONS = {"loading", "reconnecting", "not-paired", "unavailable"}
PAIRING_STATES = {"none", "code-created", "waiting-for-nik", "paired"}
SESSION_STATES = {"open", "active", "revoked", "closed", "expired"}
SEASON_PHASES = {"entering", "waiting-for-rival", "results-ready", "committed"}
SEASON_TIEBREAKS = {"none", "league-position", "league-points", "draw"}
MANAGER_INPUTS = {
    "leaguePosition",
    "leaguePoints",
    "leagueGoals",
    "domesticCup",
    "championsLeague",
    "topScorer",
    "topAssist",
}
BREAKDOWN_FIELDS = {
    "championsLeague",
    "leagueTitle",
    "domesticCup",
    "performanceBonus",
    "awardsBonus",
    "total",
}
INTERIM = "Current Showdown only. Career history is not yet available."
PREVIEW = "Preview data"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def repo_root(start: Path) -> Path:
    for candidate in [start, *start.parents]:
        if (candidate / "project-documents" / "factory").exists():
            return candidate
    raise SystemExit("Could not locate repository root.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--g11-index",
        type=Path,
        default=None,
        help="Optional path to Team G tests/fixtures/data-contract-v1/index.json",
    )
    parser.add_argument(
        "--strict-g11",
        action="store_true",
        help="Fail if the Team G G-11 manifest is not available.",
    )
    args = parser.parse_args()

    root = repo_root(Path(__file__).resolve())
    binding_path = root / "project-documents/factory/reviews/BINDING.md"
    home_path = root / "visual-assets/v10_1/home/fixtures.json"
    start_path = root / "visual-assets/v10_1/start-join/fixtures.json"
    season_path = root / "visual-assets/v10_1/season-results/fixtures.json"
    default_g11 = root / "tests/fixtures/data-contract-v1/index.json"
    g11_path = args.g11_index or default_g11

    errors: list[str] = []
    warnings: list[str] = []

    def check(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    binding = binding_path.read_text(encoding="utf-8")
    home = load_json(home_path)
    start = load_json(start_path)
    season = load_json(season_path)

    # Documentation coverage: these are the exact contract fields this part binds.
    required_binding_tokens = [
        "viewerRole",
        "continue.state",
        "continue.leagueId",
        "continue.clubs.daniel",
        "continue.clubs.nik",
        "continue.season",
        "continue.totalSeasons",
        "continue.score.daniel",
        "continue.score.nik",
        "tiles.history.available",
        "pairing.state",
        "pairing.code",
        "session.state",
        "leaguePosition",
        "leaguePoints",
        "leagueGoals",
        "domesticCup",
        "championsLeague",
        "topScorer",
        "topAssist",
        "breakdown.performanceBonus",
        "breakdown.awardsBonus",
        "winner",
        "tiebreak",
        "nav.locked",
        "nav.reason",
        "Preview data",
        INTERIM,
    ]
    for token in required_binding_tokens:
        check(token in binding, f"BINDING.md missing required token: {token}")

    # Home fixture checks.
    home_frames = home.get("frames", {})
    for frame_id in ("HM1", "HM2", "HM3"):
        frame = home_frames.get(frame_id)
        check(isinstance(frame, dict), f"Home {frame_id} missing")
        if not isinstance(frame, dict):
            continue
        tiles = frame.get("tiles")
        check(isinstance(tiles, dict), f"Home {frame_id}.tiles missing")
        if isinstance(tiles, dict):
            check(
                set(tiles) == {"history", "statistics", "trophyRoom", "rivalry"},
                f"Home {frame_id} tile keys drifted: {sorted(tiles)}",
            )
            for tile_name, tile in tiles.items():
                check(
                    isinstance(tile.get("available"), bool),
                    f"Home {frame_id}.{tile_name}.available must be boolean",
                )
                reason = tile.get("reason")
                check(
                    reason is None or reason in HOME_REASONS,
                    f"Home {frame_id}.{tile_name}.reason invalid: {reason!r}",
                )
    messages = home.get("availabilityMessages", {})
    check(set(messages) == HOME_REASONS, "Home availabilityMessages must match contract reason enum")

    # Start / Join fixture checks.
    check(start.get("strings", {}).get("previewLabel") == PREVIEW, "Start / Join preview label drifted")
    check(start.get("strings", {}).get("interimLabel") == INTERIM, "Start / Join interim label drifted")
    for frame_id, frame in start.get("frames", {}).items():
        status = frame.get("status")
        check(status in STATUSES, f"Start / Join {frame_id}.status invalid: {status!r}")
        check(
            frame.get("managerOrder") == ["daniel", "nik"],
            f"Start / Join {frame_id} manager order must be Daniel then Nik",
        )
        pairing = frame.get("pairing")
        if isinstance(pairing, dict):
            check(
                pairing.get("state") in PAIRING_STATES,
                f"Start / Join {frame_id}.pairing.state invalid: {pairing.get('state')!r}",
            )
            if "code" in pairing:
                check(
                    frame.get("viewer") == "daniel",
                    f"Start / Join {frame_id} exposes pairing.code outside Daniel host view",
                )
        session = frame.get("session")
        if isinstance(session, dict) and "state" in session:
            check(
                session["state"] in SESSION_STATES,
                f"Start / Join {frame_id}.session.state invalid: {session['state']!r}",
            )

    # Season Results fixture checks.
    check(season.get("strings", {}).get("previewLabel") == PREVIEW, "Season Results preview label drifted")
    check(season.get("strings", {}).get("interimLabel") == INTERIM, "Season Results interim label drifted")
    for frame_id, frame in season.get("frames", {}).items():
        status = frame.get("status")
        check(status in STATUSES, f"Season Results {frame_id}.status invalid: {status!r}")
        check(
            frame.get("managerOrder") == ["daniel", "nik"],
            f"Season Results {frame_id} manager order must be Daniel then Nik",
        )

        phase = frame.get("phase")
        if phase is not None:
            if phase == "unpublished-review":
                check(
                    "SR2_REVIEW phase = unpublished-review is Team V display state only" in binding,
                    "BINDING.md must document unpublished-review as display-only",
                )
            else:
                check(phase in SEASON_PHASES, f"Season Results {frame_id}.phase invalid: {phase!r}")

        managers = frame.get("managers", {})
        if isinstance(managers, dict):
            for manager, values in managers.items():
                check(manager in {"daniel", "nik"}, f"Season Results {frame_id} unknown manager {manager}")
                check(
                    set(values) == MANAGER_INPUTS,
                    f"Season Results {frame_id}.{manager} input keys drifted: {sorted(values)}",
                )

        sealed = frame.get("sealed", [])
        if phase not in {"results-ready", "committed"}:
            for manager in sealed:
                check(
                    manager not in managers,
                    f"Season Results {frame_id} leaks sealed rival {manager}",
                )

        breakdown = frame.get("breakdown")
        if isinstance(breakdown, dict):
            for manager, values in breakdown.items():
                check(manager in {"daniel", "nik"}, f"Season Results {frame_id} breakdown manager invalid")
                check(
                    set(values) == BREAKDOWN_FIELDS,
                    f"Season Results {frame_id}.{manager} breakdown keys drifted: {sorted(values)}",
                )

        winner = frame.get("winner")
        check(
            winner is None or winner in {"daniel", "nik", "draw"},
            f"Season Results {frame_id}.winner invalid: {winner!r}",
        )
        tiebreak = frame.get("tiebreak")
        check(
            tiebreak is None or tiebreak in SEASON_TIEBREAKS,
            f"Season Results {frame_id}.tiebreak invalid: {tiebreak!r}",
        )

    # Optional G-11 manifest checks. The factory branch did not contain it when
    # JOB-104 part 1 was authored; --strict-g11 becomes useful once Team G's
    # fixture set is copied in.
    if g11_path.exists():
        g11 = load_json(g11_path)
        screens = g11.get("screens", {})
        check(screens.get("home") == "viewers.<manager>.home", "G-11 Home root drifted")
        check(screens.get("startJoin") == "viewers.<manager>.startJoin", "G-11 Start / Join root drifted")
        check(
            screens.get("seasonResults")
            == "viewers.<manager>.seasonResults and seasonResultsBySeason[]",
            "G-11 Season Results root drifted",
        )
        check(g11.get("nav", {}).get("file") == "nav.json", "G-11 nav source drifted")
    else:
        message = f"G-11 manifest not present at {g11_path}; binding uses pinned Team G delivery manifest."
        if args.strict_g11:
            errors.append(message)
        else:
            warnings.append(message)

    for warning in warnings:
        print(f"WARN: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        print(f"{len(errors)} errors", file=sys.stderr)
        return 1

    print("0 errors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
