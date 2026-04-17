"""Lambda handler for AI-powered Rally summary generation using Claude."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, date, timezone

import anthropic
import boto3

from rally_client import RallyClient
from utils import get_fiscal_year_quarter, make_response

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

MODEL_ID = "claude-opus-4-7"
MAX_TOKENS = 4096


def _get_env(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise EnvironmentError(f"Required environment variable {name!r} is not set")
    return value


def _parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def _format_data_for_prompt(
    features: list[dict],
    stories: list[dict],
    tasks: list[dict],
    start_date: str,
    end_date: str,
) -> str:
    lines = [
        f"Rally data for period {start_date} to {end_date}.",
        f"Features ({len(features)}): " + (
            "; ".join(
                f"{f.get('FormattedID')} - {f.get('Name')} [State: {f.get('State')},"
                f" PlanEstimate: {f.get('PlanEstimate')}, Done: {f.get('PercentDoneByStoryCount')}%]"
                for f in features
            ) or "None"
        ),
        "",
        f"User Stories ({len(stories)}): ",
    ]
    for s in stories:
        lines.append(
            f"  {s.get('FormattedID')} - {s.get('Name')} "
            f"[Feature: {s.get('Feature')}, State: {s.get('ScheduleState') or s.get('State')}, "
            f"Points: {s.get('PlanEstimate')}, Owner: {s.get('Owner')}]"
        )

    lines += ["", f"Tasks ({len(tasks)}): "]
    for t in tasks:
        lines.append(
            f"  {t.get('FormattedID')} - {t.get('Name')} "
            f"[Story: {t.get('WorkProduct')}, State: {t.get('State')}, "
            f"Estimate: {t.get('Estimate')}h, Actuals: {t.get('Actuals')}h, ToDo: {t.get('ToDo')}h]"
        )
    return "\n".join(lines)


def _build_prompt(data_str: str, summary_type: str, is_executive: bool) -> str:
    if is_executive:
        return f"""You are a technical program manager. Given the following Rally data, write a concise executive summary.

{data_str}

Write a 2-3 paragraph executive summary suitable for senior leadership. Include:
- Key accomplishments and milestones
- Overall team velocity and completion percentage
- Any notable risks or blockers
- Overall portfolio health status (GREEN/YELLOW/RED with justification)

Use markdown formatting. Start with a ## Executive Summary heading."""

    period_word = {"weekly": "week", "monthly": "month", "quarterly": "quarter"}.get(summary_type, "period")
    return f"""You are a technical program manager. Given the following Rally data, write a detailed {summary_type} summary.

{data_str}

Write a comprehensive {period_word} summary with these sections:
## {summary_type.capitalize()} Rally Summary
### Overview
### Completed Work (list each completed story with points)
### In Progress
### Key Metrics (table with: Points Accepted, Points In Progress, Team Velocity, Stories Completed, Defects Resolved)
### Risks & Blockers

Use markdown formatting. Be specific and reference actual FormattedIDs and names from the data."""


def _extract_metrics(features: list[dict], stories: list[dict], tasks: list[dict]) -> dict:
    features_completed = sum(1 for f in features if f.get("State") in ("Completed", "Accepted"))
    stories_completed = sum(1 for s in stories if s.get("ScheduleState") in ("Completed", "Accepted") or s.get("State") in ("Completed", "Accepted"))
    stories_in_progress = sum(1 for s in stories if s.get("ScheduleState") == "In-Progress" or s.get("State") == "In-Progress")
    tasks_completed = sum(1 for t in tasks if t.get("State") == "Completed")
    total_points = sum(
        float(s.get("PlanEstimate") or 0)
        for s in stories
        if s.get("ScheduleState") in ("Completed", "Accepted") or s.get("State") in ("Completed", "Accepted")
    )
    return {
        "features_completed": features_completed,
        "stories_completed": stories_completed,
        "stories_in_progress": stories_in_progress,
        "tasks_completed": tasks_completed,
        "total_points_accepted": int(total_points),
        "team_velocity": int(total_points),
    }


def handler(event: dict, context) -> dict:
    try:
        body = event.get("body", "{}")
        if isinstance(body, str):
            body = json.loads(body)
        start_date: str = body.get("start_date", "")
        end_date: str = body.get("end_date", "")
        summary_type: str = body.get("summary_type", "weekly")

        if not start_date or not end_date:
            return make_response(400, {"error": "start_date and end_date are required (YYYY-MM-DD)"})

        api_key = _get_env("RALLY_API_KEY")
        workspace = _get_env("RALLY_WORKSPACE")
        bucket = _get_env("EXPORT_BUCKET")
        anthropic_key = _get_env("ANTHROPIC_API_KEY")

    except EnvironmentError as exc:
        logger.error("Config error: %s", exc)
        return make_response(500, {"error": str(exc)})
    except (json.JSONDecodeError, KeyError) as exc:
        return make_response(400, {"error": f"Invalid request body: {exc}"})

    try:
        start = _parse_date(start_date)
        end = _parse_date(end_date)
    except ValueError:
        return make_response(400, {"error": "Dates must be in YYYY-MM-DD format"})

    logger.info("Generating %s summary for %s – %s", summary_type, start_date, end_date)

    try:
        rally = RallyClient(api_key=api_key, workspace=workspace)
        fiscal_year, fiscal_quarter = get_fiscal_year_quarter(start)

        features = rally.get_features(fiscal_year, fiscal_quarter)
        feature_ids = [f.get("FormattedID") for f in features if f.get("FormattedID")]
        stories = rally.get_user_stories(fiscal_year, fiscal_quarter, feature_ids)
        story_ids = [s.get("FormattedID") for s in stories if s.get("FormattedID")]
        tasks = rally.get_tasks(story_ids)

        data_str = _format_data_for_prompt(features, stories, tasks, start_date, end_date)
        metrics = _extract_metrics(features, stories, tasks)

        ai_client = anthropic.Anthropic(api_key=anthropic_key)

        # Generate main summary
        main_prompt = _build_prompt(data_str, summary_type, is_executive=False)
        main_response = ai_client.messages.create(
            model=MODEL_ID,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": main_prompt}],
        )
        main_summary = main_response.content[0].text

        # Generate executive summary
        exec_prompt = _build_prompt(data_str, summary_type, is_executive=True)
        exec_response = ai_client.messages.create(
            model=MODEL_ID,
            max_tokens=1024,
            messages=[{"role": "user", "content": exec_prompt}],
        )
        exec_summary = exec_response.content[0].text

        # Save to S3
        now = datetime.now(timezone.utc)
        ts = now.strftime("%Y%m%d_%H%M%S")
        s3_key = f"summaries/{now.year}/{now.strftime('%m')}/summary_{ts}.json"
        payload = {
            "summary": main_summary,
            "executive_summary": exec_summary,
            "metrics": metrics,
            "start_date": start_date,
            "end_date": end_date,
            "summary_type": summary_type,
            "generated_at": now.isoformat(),
        }

        s3 = boto3.client("s3")
        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=json.dumps(payload, indent=2),
            ContentType="application/json",
        )
        logger.info("Saved summary to s3://%s/%s", bucket, s3_key)

        return make_response(200, {**payload, "s3_key": s3_key})

    except Exception as exc:
        logger.exception("Summary generation failed")
        return make_response(500, {"error": str(exc)})
