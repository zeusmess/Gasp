"""Read social media data exports and turn them into a timeline of activity events.

Works with the "Download your information" exports of Instagram, Facebook, TikTok,
X (Twitter), YouTube / Google Takeout, Threads, Snapchat and similar platforms.
Instead of one parser per platform, it walks every JSON (and X's .js) file and
picks out anything that looks like a timestamp, keeping the nearest text as a label.
"""

from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

TIMESTAMP_KEYS = {
    "timestamp", "timestamp_ms", "creation_timestamp", "taken_at", "created_at",
    "createdat", "time", "date", "start_timestamp", "start_time", "creation_time",
    "upload_timestamp", "last_modified_timestamp",
}
TEXT_KEYS = (
    "title", "text", "full_text", "content", "comment", "value", "caption",
    "name", "description", "link", "href", "url",
)
PLATFORMS = (
    "instagram", "facebook", "messenger", "tiktok", "twitter", "youtube",
    "threads", "snapchat", "linkedin", "whatsapp", "telegram", "reddit", "google",
)
# Anything earlier than this is not a real activity time (e.g. a stray small number).
MIN_EPOCH = datetime(2005, 1, 1, tzinfo=timezone.utc).timestamp()
MAX_FILE_BYTES = 200 * 1024 * 1024


@dataclass(frozen=True)
class Event:
    when: datetime  # timezone-aware, in the user's timezone
    platform: str
    kind: str
    text: str


def _parse_time(value) -> datetime | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        seconds = float(value)
        if seconds > 1e12:  # milliseconds
            seconds /= 1000
        if seconds < MIN_EPOCH:
            return None
        try:
            return datetime.fromtimestamp(seconds, tz=timezone.utc)
        except (OverflowError, OSError, ValueError):
            return None
    if isinstance(value, str):
        s = value.strip()
        if s.isdigit():
            return _parse_time(int(s))
        candidates = [s, s.replace("Z", "+00:00"), s.replace(" UTC", "+00:00")]
        for c in candidates:
            try:
                dt = datetime.fromisoformat(c)
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        for fmt in ("%a %b %d %H:%M:%S %z %Y", "%Y-%m-%d %H:%M:%S", "%b %d, %Y, %I:%M:%S %p %Z"):
            try:
                dt = datetime.strptime(s, fmt)
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
    return None


def _text_of(node: dict) -> str:
    for key in TEXT_KEYS:
        for k, v in node.items():
            if k.lower() == key and isinstance(v, str) and v.strip():
                return _fix_mojibake(v.strip())
    return ""


def _fix_mojibake(text: str) -> str:
    """Facebook/Instagram exports store UTF-8 (e.g. Arabic) as latin-1 escapes."""
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def _platform_for(path: Path, root: Path) -> str:
    lowered = str(path.relative_to(root)).lower()
    for name in PLATFORMS:
        if name in lowered:
            return "x" if name == "twitter" else name
    return path.relative_to(root).parts[0] if len(path.relative_to(root).parts) > 1 else "other"


def _kind_for(path: Path) -> str:
    stem = re.sub(r"[_-]?\d+$", "", path.stem)  # post_comments_1 -> post_comments
    return stem.replace("-", "_").lower() or "activity"


def _load(path: Path):
    raw = path.read_text(encoding="utf-8", errors="replace")
    if path.suffix == ".js":  # X/Twitter: window.YTD.tweets.part0 = [...]
        raw = raw[raw.find("=") + 1:] if "=" in raw.split("\n", 1)[0] else raw
    return json.loads(raw)


def _walk(node, label: str, out: list[tuple[datetime, str]]) -> None:
    if isinstance(node, dict):
        own = _text_of(node)
        if len(own) < 3 and label:  # e.g. an emoji "value" under an account "title"
            own = label
        found = None
        for k, v in node.items():
            if k.lower() in TIMESTAMP_KEYS:
                found = _parse_time(v)
                if found:
                    break
        if found:
            out.append((found, own))
        for v in node.values():
            if isinstance(v, (dict, list)):
                _walk(v, own, out)
    elif isinstance(node, list):
        for item in node:
            _walk(item, label, out)


class ActivityStore:
    def __init__(self, exports_dir: str | Path, tz_name: str = "Africa/Cairo"):
        self.root = Path(exports_dir).expanduser().resolve()
        self.tz = ZoneInfo(tz_name)
        self._events: list[Event] | None = None
        self.skipped: list[str] = []

    @property
    def events(self) -> list[Event]:
        if self._events is None:
            self._events = self._scan()
        return self._events

    def reload(self) -> None:
        self._events = None

    def _scan(self) -> list[Event]:
        events: dict[tuple, Event] = {}
        if not self.root.is_dir():
            return []
        for dirpath, _, files in os.walk(self.root):
            for name in files:
                path = Path(dirpath) / name
                if path.suffix.lower() not in (".json", ".js"):
                    continue
                if path.stat().st_size > MAX_FILE_BYTES:
                    self.skipped.append(f"{path.name} (too large)")
                    continue
                try:
                    data = _load(path)
                except (json.JSONDecodeError, UnicodeDecodeError, OSError):
                    self.skipped.append(path.name)
                    continue
                found: list[tuple[datetime, str]] = []
                _walk(data, "", found)
                platform, kind = _platform_for(path, self.root), _kind_for(path)
                for when, text in found:
                    key = (when, platform, kind)
                    text = text[:160]
                    # A record and its nested parts often share one timestamp: keep one, with the best text.
                    if key not in events or len(text) > len(events[key].text):
                        events[key] = Event(when.astimezone(self.tz), platform, kind, text)
        return sorted(events.values(), key=lambda e: e.when)

    # ---- queries used by the agent's tools ----

    def overview(self) -> dict:
        ev = self.events
        if not ev:
            return {"events": 0, "exports_dir": str(self.root), "skipped_files": self.skipped}
        by_source = Counter((e.platform, e.kind) for e in ev)
        return {
            "events": len(ev),
            "first_day": ev[0].when.date().isoformat(),
            "last_day": ev[-1].when.date().isoformat(),
            "timezone": str(self.tz),
            "sources": [
                {"platform": p, "activity": k, "count": c} for (p, k), c in by_source.most_common(60)
            ],
            "skipped_files": self.skipped[:20],
        }

    def day(self, day: date, max_items: int = 250) -> dict:
        items = [e for e in self.events if e.when.date() == day]
        hours = Counter(e.when.hour for e in items)
        # Merge bursts: same platform+activity within 15 minutes become one line.
        sessions: list[dict] = []
        for e in items:
            last = sessions[-1] if sessions else None
            if (last and last["platform"] == e.platform and last["activity"] == e.kind
                    and (e.when - last["_end"]).total_seconds() <= 900):
                last["_end"] = e.when
                last["count"] += 1
                if e.text and len(last["examples"]) < 3 and e.text not in last["examples"]:
                    last["examples"].append(e.text)
            else:
                sessions.append({"_start": e.when, "_end": e.when, "platform": e.platform,
                                 "activity": e.kind, "count": 1,
                                 "examples": [e.text] if e.text else []})
        for s in sessions:
            s["from"] = s.pop("_start").strftime("%H:%M")
            s["to"] = s.pop("_end").strftime("%H:%M")
        return {
            "day": day.isoformat(),
            "weekday": day.strftime("%A"),
            "total_events": len(items),
            "first_activity": items[0].when.strftime("%H:%M") if items else None,
            "last_activity": items[-1].when.strftime("%H:%M") if items else None,
            "events_per_hour": {f"{h:02d}": hours[h] for h in sorted(hours)},
            "sessions": sessions[:max_items],
            "truncated": len(sessions) > max_items,
        }

    def patterns(self, start: date, end: date) -> dict:
        items = [e for e in self.events if start <= e.when.date() <= end]
        if not items:
            return {"from": start.isoformat(), "to": end.isoformat(), "total_events": 0}
        per_day: dict[date, list[Event]] = defaultdict(list)
        for e in items:
            per_day[e.when.date()].append(e)

        def avg_time(times: list[datetime]) -> str:
            mins = sorted(t.hour * 60 + t.minute for t in times)
            m = mins[len(mins) // 2]  # median is robust to late nights
            return f"{m // 60:02d}:{m % 60:02d}"

        hours = Counter(e.when.hour for e in items)
        weekdays = Counter(e.when.strftime("%A") for e in items)
        return {
            "from": start.isoformat(),
            "to": end.isoformat(),
            "active_days": len(per_day),
            "total_events": len(items),
            "median_first_activity": avg_time([v[0].when for v in per_day.values()]),
            "median_last_activity": avg_time([v[-1].when for v in per_day.values()]),
            "events_per_hour_of_day": {f"{h:02d}": hours[h] for h in range(24)},
            "events_per_weekday": dict(weekdays.most_common()),
            "top_platforms": dict(Counter(e.platform for e in items).most_common(10)),
            "top_activities": dict(Counter(f"{e.platform}:{e.kind}" for e in items).most_common(15)),
            "busiest_days": [
                {"day": d.isoformat(), "events": len(v)}
                for d, v in sorted(per_day.items(), key=lambda kv: -len(kv[1]))[:5]
            ],
        }
