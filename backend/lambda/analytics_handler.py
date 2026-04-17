"""Lambda handler for Rally analytics: burn chart, velocity, cycle time, resource allocation, stale stories."""
from __future__ import annotations

import json
import logging
import os
import statistics
import calendar
from datetime import date, datetime, timedelta, timezone
from typing import Any

import boto3

from rally_client import RallyClient
from utils import get_fiscal_year_quarter, make_response

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

STALE_THRESHOLD_DAYS = 7


def _get_env(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise EnvironmentError(f"Required environment variable {name!r} is not set")
    return value


def _parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def _safe_date(s: str | None) -> date | None:
    if not s or s.startswith("0001"):
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


# ── Sprint computation ────────────────────────────────────────────────────────

def _generate_sprints(start_date: date, end_date: date) -> list[dict]:
    """Generate monthly sprint boundaries between start_date and end_date."""
    sprints = []
    current = date(start_date.year, start_date.month, 1)
    while current <= end_date:
        last_day = calendar.monthrange(current.year, current.month)[1]
        sprint_end = date(current.year, current.month, last_day)
        sprints.append({"name": current.strftime("%b %Y"), "start": current, "end": sprint_end})
        current = date(current.year + (current.month == 12), current.month % 12 + 1, 1)
    return sprints


def _compute_sprints(stories: list[dict], start_date: date, end_date: date) -> list[dict]:
    result = []
    for sprint in _generate_sprints(start_date, end_date):
        s_start, s_end = sprint["start"], sprint["end"]

        # Stories created this sprint + carry-over (created earlier, not accepted before sprint)
        sprint_new = [
            s for s in stories
            if _safe_date(s.get("CreationDate")) and s_start <= _safe_date(s["CreationDate"]) <= s_end
        ]
        carry_over = [
            s for s in stories
            if _safe_date(s.get("CreationDate")) and _safe_date(s["CreationDate"]) < s_start
            and (not _safe_date(s.get("AcceptedDate")) or _safe_date(s["AcceptedDate"]) >= s_start)
        ]
        all_stories = sprint_new + carry_over
        planned_points = sum(float(s.get("PlanEstimate") or 0) for s in all_stories)

        # Accepted this sprint
        accepted = [
            s for s in all_stories
            if _safe_date(s.get("AcceptedDate")) and s_start <= _safe_date(s["AcceptedDate"]) <= s_end
        ]
        completed_points = sum(float(s.get("PlanEstimate") or 0) for s in accepted)

        # Daily burn: step down when stories are accepted
        days_total = (s_end - s_start).days + 1
        ideal_per_day = planned_points / days_total if days_total else 0
        accepted_by_date: dict[str, float] = {}
        for s in accepted:
            d_str = s["AcceptedDate"][:10]
            accepted_by_date[d_str] = accepted_by_date.get(d_str, 0) + float(s.get("PlanEstimate") or 0)

        daily_burn: list[dict] = []
        remaining = planned_points
        for i in range(days_total):
            day = s_start + timedelta(days=i)
            remaining = max(0.0, remaining - accepted_by_date.get(day.isoformat(), 0))
            ideal = max(0.0, planned_points - ideal_per_day * (i + 1))
            daily_burn.append({"day": i + 1, "date": day.isoformat(),
                                "remaining": round(remaining, 1), "ideal": round(ideal, 1)})

        result.append({
            "name": sprint["name"],
            "start": s_start.isoformat(),
            "end": s_end.isoformat(),
            "planned_points": int(planned_points),
            "completed_points": int(completed_points),
            "stories_planned": len(all_stories),
            "stories_completed": len(accepted),
            "carry_over_points": max(0, int(planned_points - completed_points)),
            "velocity": int(completed_points),
            "daily_burn": daily_burn,
        })
    return result


# ── Cycle time ────────────────────────────────────────────────────────────────

def _compute_cycle_times(stories: list[dict]) -> dict:
    today = date.today()
    records: list[dict] = []

    for s in stories:
        start = _safe_date(s.get("CreationDate"))
        if not start:
            continue
        end = _safe_date(s.get("AcceptedDate"))
        cycle_days = (end - start).days if end else (today - start).days

        records.append({
            "id": s.get("FormattedID", ""),
            "name": s.get("Name", ""),
            "owner": s.get("OwnerName") or "",
            "owner_email": s.get("OwnerEmail") or "",
            "points": float(s.get("PlanEstimate") or 0),
            "start_date": start.isoformat(),
            "end_date": end.isoformat() if end else None,
            "cycle_days": max(0, cycle_days),
            "state": s.get("ScheduleState") or s.get("State") or "",
            "feature": s.get("Feature") or "",
            "is_outlier": False,
        })

    if not records:
        return {"avg_days": 0, "median_days": 0, "p75_days": 0, "p90_days": 0, "stories": []}

    days_list = [r["cycle_days"] for r in records]
    avg = statistics.mean(days_list)
    std = statistics.stdev(days_list) if len(days_list) > 1 else 0
    median = statistics.median(days_list)
    sorted_days = sorted(days_list)
    n = len(sorted_days)
    p75 = sorted_days[int(n * 0.75)] if n >= 4 else sorted_days[-1]
    p90 = sorted_days[int(n * 0.90)] if n >= 10 else sorted_days[-1]
    outlier_threshold = avg + 1.5 * std if std else avg * 2

    for r in records:
        r["is_outlier"] = r["cycle_days"] > outlier_threshold

    return {
        "avg_days": round(avg, 1),
        "median_days": round(median, 1),
        "p75_days": int(p75),
        "p90_days": int(p90),
        "outlier_threshold": round(outlier_threshold, 1),
        "stories": sorted(records, key=lambda x: x["cycle_days"], reverse=True),
    }


# ── Resource allocation ───────────────────────────────────────────────────────

def _compute_resource_allocation(stories: list[dict], tasks: list[dict]) -> list[dict]:
    alloc: dict[str, dict] = {}

    def _init(owner: str, email: str) -> dict:
        return {
            "owner": owner, "email": email,
            "stories_count": 0, "total_points": 0.0,
            "hours_estimated": 0.0, "hours_actual": 0.0, "hours_remaining": 0.0,
            "stories_completed": 0, "story_ids": [],
        }

    for s in stories:
        owner = s.get("OwnerName") or "Unassigned"
        if owner not in alloc:
            alloc[owner] = _init(owner, s.get("OwnerEmail") or "")
        a = alloc[owner]
        a["stories_count"] += 1
        a["total_points"] += float(s.get("PlanEstimate") or 0)
        a["story_ids"].append(s.get("FormattedID", ""))
        if (s.get("ScheduleState") or s.get("State")) in ("Completed", "Accepted"):
            a["stories_completed"] += 1

    for t in tasks:
        owner = t.get("OwnerName") or "Unassigned"
        if owner not in alloc:
            alloc[owner] = _init(owner, t.get("OwnerEmail") or "")
        a = alloc[owner]
        a["hours_estimated"] += float(t.get("Estimate") or 0)
        a["hours_actual"] += float(t.get("Actuals") or 0)
        a["hours_remaining"] += float(t.get("ToDo") or 0)

    result = []
    for a in alloc.values():
        total = a["stories_count"]
        a["completion_rate"] = round(a["stories_completed"] / total * 100, 1) if total else 0
        a["total_points"] = int(a["total_points"])
        a["hours_estimated"] = round(a["hours_estimated"], 1)
        a["hours_actual"] = round(a["hours_actual"], 1)
        a["hours_remaining"] = round(a["hours_remaining"], 1)
        result.append(a)

    return sorted(result, key=lambda x: x["total_points"], reverse=True)


# ── Stale / blocked stories ───────────────────────────────────────────────────

def _compute_stale_stories(stories: list[dict]) -> list[dict]:
    today = date.today()
    stale = []
    for s in stories:
        state = s.get("ScheduleState") or s.get("State") or ""
        if state in ("Accepted", "Completed"):
            continue
        last_updated = _safe_date(s.get("LastUpdateDate"))
        if not last_updated:
            continue
        days_stale = (today - last_updated).days
        if days_stale >= STALE_THRESHOLD_DAYS:
            stale.append({
                "id": s.get("FormattedID", ""),
                "name": s.get("Name", ""),
                "owner": s.get("OwnerName") or "Unassigned",
                "owner_email": s.get("OwnerEmail") or "",
                "state": state,
                "last_updated": last_updated.isoformat(),
                "days_stale": days_stale,
                "points": float(s.get("PlanEstimate") or 0),
                "feature": s.get("Feature") or "",
                "severity": "critical" if days_stale >= 14 else "warning",
            })
    return sorted(stale, key=lambda x: x["days_stale"], reverse=True)


# ── Handler ───────────────────────────────────────────────────────────────────

def handler(event: dict, context: Any) -> dict:
    query_params = event.get("queryStringParameters") or {}
    start_date_str = query_params.get("start_date", "")
    end_date_str = query_params.get("end_date", "")

    if not start_date_str or not end_date_str:
        return make_response(400, {"error": "start_date and end_date query params are required (YYYY-MM-DD)"})

    try:
        start_date = _parse_date(start_date_str)
        end_date = _parse_date(end_date_str)
        api_key = _get_env("RALLY_API_KEY")
        workspace = _get_env("RALLY_WORKSPACE")
    except (ValueError, EnvironmentError) as exc:
        return make_response(400 if isinstance(exc, ValueError) else 500, {"error": str(exc)})

    logger.info("Computing analytics for %s – %s", start_date_str, end_date_str)

    try:
        client = RallyClient(api_key=api_key, workspace=workspace)
        fiscal_year, fiscal_quarter = get_fiscal_year_quarter(start_date)

        features = client.get_features(fiscal_year, fiscal_quarter)
        feature_ids = [f.get("FormattedID") for f in features if f.get("FormattedID")]
        stories = client.get_user_stories(
            fiscal_year, fiscal_quarter, feature_ids,
            start_date=start_date_str, end_date=end_date_str,
        )
        story_ids = [s.get("FormattedID") for s in stories if s.get("FormattedID")]
        tasks = client.get_tasks(story_ids)

        sprints = _compute_sprints(stories, start_date, end_date)
        cycle_time = _compute_cycle_times(stories)
        resource_allocation = _compute_resource_allocation(stories, tasks)
        stale_stories = _compute_stale_stories(stories)

        velocities = [sp["velocity"] for sp in sprints if sp["velocity"] > 0]
        avg_velocity = round(statistics.mean(velocities), 1) if velocities else 0
        on_time = sum(1 for s in stories if _safe_date(s.get("AcceptedDate")) and
                      _safe_date(s.get("AcceptedDate")) <= _safe_date(s.get("LastUpdateDate") or ""))

        return make_response(200, {
            "period": {"start": start_date_str, "end": end_date_str},
            "sprints": sprints,
            "cycle_time": cycle_time,
            "resource_allocation": resource_allocation,
            "stale_stories": stale_stories,
            "summary_stats": {
                "total_stories": len(stories),
                "total_points": int(sum(float(s.get("PlanEstimate") or 0) for s in stories)),
                "avg_velocity": avg_velocity,
                "stale_count": len(stale_stories),
                "avg_cycle_days": cycle_time["avg_days"],
                "outlier_count": sum(1 for s in cycle_time["stories"] if s["is_outlier"]),
            },
        })

    except Exception as exc:
        logger.exception("Analytics computation failed")
        return make_response(500, {"error": str(exc)})
