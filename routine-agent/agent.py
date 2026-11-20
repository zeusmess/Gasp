"""Daily-routine agent: reads your social media exports and keeps a routine journal.

Usage:
    python agent.py                     # chat with the agent
    python agent.py --day 2026-11-19    # write the journal entry for one day, then exit
    python agent.py --today             # same, for today
    python agent.py --profile           # build/refresh your overall routine profile
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import anthropic
from anthropic import beta_tool

from activity import ActivityStore

HERE = Path(__file__).resolve().parent
EXPORTS_DIR = Path(os.environ.get("ROUTINE_EXPORTS_DIR", HERE / "exports"))
JOURNAL_DIR = Path(os.environ.get("ROUTINE_JOURNAL_DIR", HERE / "journal"))
TIMEZONE = os.environ.get("ROUTINE_TZ", "Africa/Cairo")
MODEL = os.environ.get("ROUTINE_MODEL", "claude-opus-5-5")
MAX_TOOL_ROUNDS = 25

store = ActivityStore(EXPORTS_DIR, TIMEZONE)

SYSTEM_PROMPT = f"""You are a personal daily-routine assistant. The user is Egyptian; reply in Egyptian Arabic
unless they write in another language.

Your job: understand the user's daily routine from their social media activity (exported data files
from Instagram, Facebook, TikTok, X, YouTube and others) and keep a journal of it.

What the data can and cannot tell you:
- Timestamps of likes, comments, posts, messages, searches, watched videos show when the user was awake,
  online and what they were into. Long gaps usually mean sleep, work, study, prayer, going out, etc.
- Never state a gap's cause as fact. Call it a guess ("غالبًا نايم", "ممكن تكون في الشغل") or ask the user.
- Anything the user tells you about their day outweighs what the data suggests. Save it with add_note.

When writing a day's entry (save_day_routine), use Markdown with these sections:
1. ملخص اليوم: 2-3 lines.
2. الجدول: time blocks (e.g. 08:10–09:00 ...), merging close activity into blocks and marking offline gaps.
3. اهتمامات اليوم: topics/accounts/content that stood out, from the examples.
4. ملاحظات: user notes for that day, and anything unusual compared to their normal routine.
Keep personal message contents out of the journal; mention only that messaging happened.

Read the existing entry (read_journal) before overwriting it, so you keep the user's notes.
Today's date is {date.today().isoformat()}, timezone {TIMEZONE}."""

DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _parse_day(value: str) -> date:
    if not DAY_RE.match(value or ""):
        raise ValueError(f"Day must be YYYY-MM-DD, got {value!r}")
    return date.fromisoformat(value)


def _json(data) -> str:
    return json.dumps(data, ensure_ascii=False, indent=1)


# ---------------------------------------------------------------- tools

@beta_tool
def list_sources() -> str:
    """List what activity data is available: platforms, activity types, event counts and the date range.
    Call this first to see which days have data."""
    return _json(store.overview())


@beta_tool
def get_day_activity(day: str) -> str:
    """Get the user's social media activity for one day as a timeline of sessions
    (bursts of the same activity merged), with events per hour and first/last activity times.

    Args:
        day: The day in YYYY-MM-DD format.
    """
    return _json(store.day(_parse_day(day)))


@beta_tool
def get_patterns(start_day: str, end_day: str) -> str:
    """Get routine patterns over a date range: typical wake/online and last-activity times (medians),
    activity per hour of day and per weekday, top platforms and activities, busiest days.

    Args:
        start_day: First day, YYYY-MM-DD.
        end_day: Last day, YYYY-MM-DD (inclusive).
    """
    return _json(store.patterns(_parse_day(start_day), _parse_day(end_day)))


@beta_tool
def read_journal(day: str) -> str:
    """Read the saved journal entry and the user's notes for a day, or the routine profile.

    Args:
        day: YYYY-MM-DD, or "profile" for the overall routine profile.
    """
    if day == "profile":
        path = JOURNAL_DIR / "routine-profile.md"
        return path.read_text(encoding="utf-8") if path.exists() else "No routine profile yet."
    d = _parse_day(day).isoformat()
    parts = []
    for label, path in (("Entry", JOURNAL_DIR / "days" / f"{d}.md"),
                        ("User notes", JOURNAL_DIR / "notes" / f"{d}.md")):
        if path.exists():
            parts.append(f"## {label}\n{path.read_text(encoding='utf-8')}")
    return "\n\n".join(parts) or f"Nothing saved for {d} yet."


@beta_tool
def save_day_routine(day: str, markdown: str) -> str:
    """Save (or overwrite) the journal entry for one day.

    Args:
        day: YYYY-MM-DD.
        markdown: The full entry in Markdown.
    """
    d = _parse_day(day).isoformat()
    path = JOURNAL_DIR / "days" / f"{d}.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(markdown.strip() + "\n", encoding="utf-8")
    return f"Saved {path}"


@beta_tool
def add_note(day: str, note: str) -> str:
    """Append something the user told you about their day (where they were, what they did, how they felt).

    Args:
        day: YYYY-MM-DD the note is about.
        note: The note, in the user's words.
    """
    d = _parse_day(day).isoformat()
    path = JOURNAL_DIR / "notes" / f"{d}.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(f"- [{datetime.now().strftime('%H:%M')}] {note.strip()}\n")
    return f"Note added to {path}"


@beta_tool
def save_routine_profile(markdown: str) -> str:
    """Save the user's overall routine profile (typical wake time, online hours, habits by weekday,
    main interests, changes over time). Overwrites the previous profile.

    Args:
        markdown: The full profile in Markdown.
    """
    path = JOURNAL_DIR / "routine-profile.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(markdown.strip() + "\n", encoding="utf-8")
    return f"Saved {path}"


@beta_tool
def list_journal_days() -> str:
    """List the days that already have a saved journal entry."""
    days_dir = JOURNAL_DIR / "days"
    days = sorted(p.stem for p in days_dir.glob("*.md")) if days_dir.exists() else []
    return _json(days)


TOOLS = [list_sources, get_day_activity, get_patterns, read_journal, save_day_routine,
         add_note, save_routine_profile, list_journal_days]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}
TOOL_SCHEMAS = [t.to_dict() for t in TOOLS]


# ---------------------------------------------------------------- agent loop

class Agent:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.messages: list = []

    def _run_tool(self, block) -> dict:
        tool = TOOLS_BY_NAME.get(block.name)
        try:
            if tool is None:
                raise ValueError(f"Unknown tool {block.name}")
            output = tool.call(block.input)
            return {"type": "tool_result", "tool_use_id": block.id, "content": str(output)}
        except Exception as exc:  # report tool errors back to Claude instead of crashing
            return {"type": "tool_result", "tool_use_id": block.id,
                    "content": f"Error: {exc}", "is_error": True}

    def send(self, user_text: str) -> str:
        self.messages.append({"role": "user", "content": user_text})
        for _ in range(MAX_TOOL_ROUNDS):
            response = self.client.beta.messages.create(
                model=MODEL,
                max_tokens=16000,
                system=SYSTEM_PROMPT,
                tools=TOOL_SCHEMAS,
                messages=self.messages,
                output_config={"effort": "medium"},
                # If the model declines, the API retries on a fallback model automatically.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
            self.messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "refusal":
                return "(Claude رفض الطلب ده. جرّب تصيغه بشكل تاني.)"
            if response.stop_reason == "max_tokens":
                return _text(response) + "\n(الرد اتقطع لأنه طويل.)"

            tool_uses = [b for b in response.content if b.type == "tool_use"]
            if response.stop_reason != "tool_use" or not tool_uses:
                return _text(response)
            for b in tool_uses:
                print(f"  ↳ {b.name}({_short(b.input)})", file=sys.stderr)
            self.messages.append({"role": "user", "content": [self._run_tool(b) for b in tool_uses]})
        return "(وقفت بعد خطوات كتير. ابعتلي تاني لو عايزني أكمل.)"


def _text(response) -> str:
    return "\n".join(b.text for b in response.content if b.type == "text").strip()


def _short(data: dict) -> str:
    s = json.dumps(data, ensure_ascii=False)
    return s if len(s) < 80 else s[:77] + "..."


# ---------------------------------------------------------------- CLI

def main() -> None:
    parser = argparse.ArgumentParser(description="Daily routine agent from social media activity")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--day", help="write the journal entry for this day (YYYY-MM-DD) and exit")
    group.add_argument("--today", action="store_true", help="write today's entry and exit")
    group.add_argument("--yesterday", action="store_true", help="write yesterday's entry and exit")
    group.add_argument("--profile", action="store_true", help="build the overall routine profile and exit")
    args = parser.parse_args()

    if not store.events:
        print(f"⚠️  مفيش بيانات في {EXPORTS_DIR}. حط ملفات التصدير (JSON) من السوشيال ميديا هناك.\n"
              "    للتجربة: ROUTINE_EXPORTS_DIR=sample_exports python agent.py", file=sys.stderr)

    agent = Agent()
    day = args.day or (date.today().isoformat() if args.today else
                       (date.today() - timedelta(days=1)).isoformat() if args.yesterday else None)
    try:
        if day:
            _parse_day(day)
            print(agent.send(f"اكتب وسجّل روتين يوم {day} من نشاطي، واحفظه في الجورنال."))
            return
        if args.profile:
            print(agent.send("حلّل كل البيانات المتاحة واعمل ملف الروتين العام بتاعي واحفظه."))
            return

        print("🗓️  وكيل الروتين اليومي. اكتب سؤالك أو 'خروج' للخروج.\n"
              "    أمثلة: سجّل روتين امبارح • إمتى بصحى عادةً؟ • النهارده رحت الجيم الساعة 7\n")
        while True:
            try:
                text = input("أنت: ").strip()
            except EOFError:
                break
            if text.lower() in {"خروج", "exit", "quit"}:
                break
            if text:
                print(f"\nالوكيل: {agent.send(text)}\n")
    except anthropic.AuthenticationError:
        sys.exit("مفتاح الـ API غلط أو مش موجود. حطه في ANTHROPIC_API_KEY.")
    except anthropic.RateLimitError:
        sys.exit("وصلت لحد الاستخدام، استنى شوية وجرّب تاني.")
    except anthropic.APIConnectionError:
        sys.exit("مش قادر أوصل لـ Anthropic API. اتأكد من النت.")
    except anthropic.APIStatusError as exc:
        sys.exit(f"خطأ من الـ API ({exc.status_code}): {exc.message}")
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
