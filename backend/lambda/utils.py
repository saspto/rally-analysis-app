"""Shared utilities for Rally Analysis Lambda functions."""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def get_fiscal_year_quarter(d: date) -> tuple[int, int]:
    """Return (fiscal_year, fiscal_quarter) for a date using an Oct-1 fiscal year start.

    FY label = the calendar year in which the FY ends (Sep 30).
    Q1 = Oct–Dec, Q2 = Jan–Mar, Q3 = Apr–Jun, Q4 = Jul–Sep

    Examples:
      Oct 1 2025  → FY2026 Q1
      Jan 15 2026 → FY2026 Q2
      Apr 17 2026 → FY2026 Q3
      Jul  1 2026 → FY2026 Q4
    """
    month = d.month
    year = d.year

    if month >= 10:
        # Oct–Dec: Q1 of the *next* fiscal year
        return year + 1, 1
    elif month <= 3:
        # Jan–Mar: Q2
        return year, 2
    elif month <= 6:
        # Apr–Jun: Q3
        return year, 3
    else:
        # Jul–Sep: Q4
        return year, 4


def fiscal_quarter_date_range(fiscal_year: int, fiscal_quarter: int) -> tuple[date, date]:
    """Return (start_date, end_date) for a given FY/Q (Oct-1 fiscal year start).

    FY label is the calendar year the FY ends (Sep 30).
    Q1 spans Oct–Dec of the *previous* calendar year.
    """
    quarter_starts = {
        1: (fiscal_year - 1, 10, 1),
        2: (fiscal_year, 1, 1),
        3: (fiscal_year, 4, 1),
        4: (fiscal_year, 7, 1),
    }
    quarter_ends = {
        1: (fiscal_year - 1, 12, 31),
        2: (fiscal_year, 3, 31),
        3: (fiscal_year, 6, 30),
        4: (fiscal_year, 9, 30),
    }
    start = date(*quarter_starts[fiscal_quarter])
    end = date(*quarter_ends[fiscal_quarter])
    return start, end


def flatten_rally_object(obj: dict[str, Any], obj_type: str) -> dict[str, Any]:
    """Flatten a nested Rally API response object to a flat dict.

    Owner is expanded to OwnerName, OwnerUserName, and OwnerEmail columns
    so every exported row clearly identifies who owns the item.
    """
    flat: dict[str, Any] = {"Type": obj_type}
    for key, value in obj.items():
        if key.startswith("_") and key not in ("_ref",):
            continue
        if key == "Owner" and isinstance(value, dict):
            flat["OwnerName"] = value.get("_refObjectName", "")
            flat["OwnerUserName"] = value.get("UserName", "")
            flat["OwnerEmail"] = value.get("EmailAddress", "")
        elif isinstance(value, dict):
            flat[key] = value.get("_refObjectName") or value.get("FormattedID") or value.get("Name") or str(value)
        elif isinstance(value, list):
            flat[key] = ", ".join(str(v) for v in value)
        else:
            flat[key] = value
    return flat


def generate_presigned_url(
    s3_client: Any,
    bucket: str,
    key: str,
    expiry: int = 3600,
) -> str:
    """Generate a pre-signed S3 URL for downloading an object."""
    try:
        url: str = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiry,
        )
        return url
    except ClientError as exc:
        logger.error("Failed to generate presigned URL for s3://%s/%s: %s", bucket, key, exc)
        raise


def cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }


def make_response(status_code: int, body: Any) -> dict[str, Any]:
    import json
    return {
        "statusCode": status_code,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
