"""Lambda handler for generating presigned S3 download URLs."""
from __future__ import annotations

import logging
import os

import boto3

from utils import generate_presigned_url, make_response

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def handler(event: dict, context) -> dict:
    query_params = event.get("queryStringParameters") or {}
    s3_key = query_params.get("key", "")

    if not s3_key:
        return make_response(400, {"error": "Missing required query parameter: key"})

    bucket = os.environ.get("EXPORT_BUCKET", "")
    if not bucket:
        return make_response(500, {"error": "EXPORT_BUCKET environment variable not set"})

    try:
        s3 = boto3.client("s3")
        url = generate_presigned_url(s3, bucket, s3_key)
        return make_response(200, {"url": url})
    except Exception as exc:
        logger.exception("Failed to generate presigned URL")
        return make_response(500, {"error": str(exc)})
