"""Tests for export_handler.py."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../lambda"))

import json
import pytest
from unittest.mock import MagicMock, patch, call


MOCK_FEATURES = [
    {"Type": "Feature", "FormattedID": "F-001", "Name": "User Authentication", "State": "Completed", "PlanEstimate": 34},
    {"Type": "Feature", "FormattedID": "F-002", "Name": "Dashboard Redesign", "State": "In-Progress", "PlanEstimate": 21},
]

MOCK_STORIES = [
    {"Type": "UserStory", "FormattedID": "US-001", "Name": "JWT Login", "ScheduleState": "Accepted", "PlanEstimate": 8, "Feature": "F-001"},
    {"Type": "UserStory", "FormattedID": "US-002", "Name": "Dashboard Charts", "ScheduleState": "In-Progress", "PlanEstimate": 5, "Feature": "F-002"},
]

MOCK_TASKS = [
    {"Type": "Task", "FormattedID": "TA-001", "Name": "Implement JWT", "State": "Completed", "WorkProduct": "US-001"},
]


@pytest.fixture
def env_vars(monkeypatch):
    monkeypatch.setenv("RALLY_API_KEY", "test_api_key")
    monkeypatch.setenv("RALLY_WORKSPACE", "test_workspace")
    monkeypatch.setenv("EXPORT_BUCKET", "test-bucket")


@patch("export_handler.boto3.client")
@patch("export_handler.RallyClient")
def test_post_export_success(mock_rally_cls, mock_boto3, env_vars):
    mock_rally = MagicMock()
    mock_rally.get_features.return_value = MOCK_FEATURES
    mock_rally.get_user_stories.return_value = MOCK_STORIES
    mock_rally.get_tasks.return_value = MOCK_TASKS
    mock_rally_cls.return_value = mock_rally

    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://presigned.url/file.csv"
    mock_boto3.return_value = mock_s3

    from export_handler import handler
    event = {"httpMethod": "POST"}
    response = handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "filename" in body
    assert body["counts"]["features"] == 2
    assert body["counts"]["user_stories"] == 2
    assert body["counts"]["tasks"] == 1
    mock_s3.put_object.assert_called_once()


@patch("export_handler.boto3.client")
@patch("export_handler.RallyClient")
def test_get_exports_list(mock_rally_cls, mock_boto3, env_vars):
    mock_s3 = MagicMock()
    mock_s3.get_paginator.return_value.paginate.return_value = [
        {"Contents": [
            {"Key": "exports/2026/04/rally_export_20260414_150000.csv", "LastModified": __import__("datetime").datetime(2026, 4, 14, 15, 0), "Size": 1024},
        ]}
    ]
    mock_s3.generate_presigned_url.return_value = "https://presigned.url/file.csv"
    mock_boto3.return_value = mock_s3

    from export_handler import handler
    event = {"httpMethod": "GET"}
    response = handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert len(body) == 1
    assert body[0]["filename"] == "rally_export_20260414_150000.csv"


def test_missing_env_var(monkeypatch):
    monkeypatch.delenv("RALLY_API_KEY", raising=False)
    monkeypatch.delenv("RALLY_WORKSPACE", raising=False)
    monkeypatch.delenv("EXPORT_BUCKET", raising=False)

    from export_handler import handler
    event = {"httpMethod": "POST"}
    response = handler(event, None)
    assert response["statusCode"] == 500
    assert "error" in json.loads(response["body"])
