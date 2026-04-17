"""Lambda handler for Rally data CSV export to S3."""
from __future__ import annotations

import csv
import io
import json
import logging
import os
from datetime import datetime, timezone

import boto3

from rally_client import RallyClient
from utils import get_fiscal_year_quarter, generate_presigned_url, make_response

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _get_env(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise EnvironmentError(f"Required environment variable {name!r} is not set")
    return value


def _build_csv(
    features: list[dict],
    stories: list[dict],
    tasks: list[dict],
) -> str:
    """Combine features, stories, and tasks into a single CSV string."""
    all_rows = features + stories + tasks
    if not all_rows:
        return ""

    # Collect all field names preserving insertion order
    fieldnames: list[str] = ["Type"]
    seen = {"Type"}
    for row in all_rows:
        for key in row:
            if key not in seen:
                fieldnames.append(key)
                seen.add(key)

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(all_rows)
    return buf.getvalue()


def _list_recent_exports(s3_client, bucket: str, limit: int = 20) -> list[dict]:
    paginator = s3_client.get_paginator("list_objects_v2")
    objects = []
    for page in paginator.paginate(Bucket=bucket, Prefix="exports/"):
        for obj in page.get("Contents", []):
            objects.append(obj)

    objects.sort(key=lambda o: o["LastModified"], reverse=True)
    result = []
    for obj in objects[:limit]:
        key = obj["Key"]
        filename = key.split("/")[-1]
        url = generate_presigned_url(s3_client, bucket, key)
        result.append({
            "filename": filename,
            "s3_key": key,
            "created_at": obj["LastModified"].isoformat(),
            "size_bytes": obj["Size"],
            "download_url": url,
        })
    return result


def handler(event: dict, context) -> dict:
    http_method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method", "POST")
        or "POST"
    ).upper()

    try:
        api_key = _get_env("RALLY_API_KEY")
        workspace = _get_env("RALLY_WORKSPACE")
        bucket = _get_env("EXPORT_BUCKET")
    except EnvironmentError as exc:
        logger.error("Configuration error: %s", exc)
        return make_response(500, {"error": str(exc)})

    s3 = boto3.client("s3")

    # GET /exports — list recent exports
    if http_method == "GET":
        try:
            exports = _list_recent_exports(s3, bucket)
            return make_response(200, exports)
        except Exception as exc:
            logger.exception("Failed to list exports")
            return make_response(500, {"error": str(exc)})

    # POST /exports or EventBridge scheduled trigger — run export
    now = datetime.now(timezone.utc)
    fiscal_year, fiscal_quarter = get_fiscal_year_quarter(now.date())

    logger.info("Starting Rally export for FY%d Q%d", fiscal_year, fiscal_quarter)

    try:
        client = RallyClient(api_key=api_key, workspace=workspace)

        features = client.get_features(fiscal_year, fiscal_quarter)
        feature_ids = [f.get("FormattedID") for f in features if f.get("FormattedID")]

        stories = client.get_user_stories(fiscal_year, fiscal_quarter, feature_ids)
        story_ids = [s.get("FormattedID") for s in stories if s.get("FormattedID")]

        tasks = client.get_tasks(story_ids)

        csv_content = _build_csv(features, stories, tasks)
        if not csv_content:
            logger.warning("No data returned from Rally")
            return make_response(200, {"message": "No data found for current FY/Q", "counts": {"features": 0, "user_stories": 0, "tasks": 0}})

        ts = now.strftime("%Y%m%d_%H%M%S")
        filename = f"rally_export_{ts}.csv"
        s3_key = f"exports/{now.year}/{now.strftime('%m')}/{filename}"

        s3.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=csv_content.encode("utf-8"),
            ContentType="text/csv",
        )
        logger.info("Uploaded %s to s3://%s/%s", filename, bucket, s3_key)

        download_url = generate_presigned_url(s3, bucket, s3_key)
        counts = {"features": len(features), "user_stories": len(stories), "tasks": len(tasks)}

        return make_response(200, {
            "filename": filename,
            "s3_key": s3_key,
            "created_at": now.isoformat(),
            "counts": counts,
            "download_url": download_url,
        })

    except Exception as exc:
        logger.exception("Export failed")
        return make_response(500, {"error": str(exc)})
