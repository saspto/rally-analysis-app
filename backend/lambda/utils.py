"""Shared utilities for Rally Analysis Lambda functions."""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def get_fiscal_year_quarter(d: date) -> tuple[int, int]:
    """Return (fiscal_year, fiscal_quarter) for a date using a Feb-1 fiscal year start.

    Q1 = Feb–Apr, Q2 = May–Jul, Q3 = Aug–Oct, Q4 = Nov–Jan
    """
    month = d.month
    year = d.year

    if month == 1:
        # January belongs to Q4 of the *previous* fiscal year
        return year, 4

    # Fiscal year starts Feb 1, so FY = calendar year for Feb-Dec
    fiscal_year = year
    if month <= 4:
        quarter = 1
    elif month <= 7:
        quarter = 2
    elif month <= 10:
        quarter = 3
    else:
        quarter = 4

    return fiscal_year, quarter


def fiscal_quarter_date_range(fiscal_year: int, fiscal_quarter: int) -> tuple[date, date]:
    """Return (start_date, end_date) for a given FY/Q."""
    quarter_starts = {
        1: (fiscal_year, 2, 1),
        2: (fiscal_year, 5, 1),
        3: (fiscal_year, 8, 1),
        4: (fiscal_year, 11, 1),
    }
    quarter_ends = {
        1: (fiscal_year, 4, 30),
        2: (fiscal_year, 7, 31),
        3: (fiscal_year, 10, 31),
        4: (fiscal_year + 1, 1, 31),
    }
    start = date(*quarter_starts[fiscal_quarter])
    end = date(*quarter_ends[fiscal_quarter])
    return start, end


def flatten_rally_object(obj: dict[str, Any], obj_type: str) -> dict[str, Any]:
    """Flatten a nested Rally API response object to a flat dict."""
    flat: dict[str, Any] = {"Type": obj_type}
    for key, value in obj.items():
        if key.startswith("_") and key not in ("_ref",):
            continue
        if isinstance(value, dict):
            # Nested ref object — extract Name or FormattedID
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
