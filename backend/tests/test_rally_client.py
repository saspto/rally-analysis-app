"""Tests for rally_client.py."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../lambda"))

import pytest
import json
from unittest.mock import MagicMock, patch
from rally_client import RallyClient

MOCK_FEATURE_RESPONSE = {
    "QueryResult": {
        "TotalResultCount": 2,
        "Results": [
            {
                "FormattedID": "F-001",
                "Name": "User Authentication",
                "State": "Completed",
                "Owner": {"_refObjectName": "Alice"},
                "PlanEstimate": 34,
                "PercentDoneByStoryCount": 100,
                "CreationDate": "2026-02-01T10:00:00Z",
                "LastUpdateDate": "2026-04-10T10:00:00Z",
            },
            {
                "FormattedID": "F-002",
                "Name": "Dashboard Redesign",
                "State": "In-Progress",
                "Owner": {"_refObjectName": "Bob"},
                "PlanEstimate": 21,
                "PercentDoneByStoryCount": 60,
                "CreationDate": "2026-02-15T10:00:00Z",
                "LastUpdateDate": "2026-04-11T10:00:00Z",
            },
        ],
    }
}


@pytest.fixture
def client():
    return RallyClient(api_key="test_key", workspace="test_workspace")


@patch("rally_client.requests.Session")
def test_get_features_returns_list(mock_session_cls, client):
    mock_response = MagicMock()
    mock_response.json.return_value = MOCK_FEATURE_RESPONSE
    mock_response.raise_for_status = MagicMock()
    mock_session = MagicMock()
    mock_session.get.return_value = mock_response
    mock_session_cls.return_value = mock_session

    c = RallyClient(api_key="test_key", workspace="test_workspace")
    features = c.get_features(2026, 1)

    assert len(features) == 2
    assert features[0]["FormattedID"] == "F-001"
    assert features[0]["Type"] == "Feature"
    assert features[0]["Owner"] == "Alice"


@patch("rally_client.requests.Session")
def test_get_features_paginates(mock_session_cls):
    # First page returns PAGE_SIZE items; second returns 0
    page1 = {
        "QueryResult": {
            "TotalResultCount": 250,
            "Results": [{"FormattedID": f"F-{i:03d}", "Name": f"Feature {i}"} for i in range(200)],
        }
    }
    page2 = {
        "QueryResult": {
            "TotalResultCount": 250,
            "Results": [{"FormattedID": f"F-{i:03d}", "Name": f"Feature {i}"} for i in range(200, 250)],
        }
    }
    mock_response1, mock_response2 = MagicMock(), MagicMock()
    mock_response1.json.return_value = page1
    mock_response1.raise_for_status = MagicMock()
    mock_response2.json.return_value = page2
    mock_response2.raise_for_status = MagicMock()

    mock_session = MagicMock()
    mock_session.get.side_effect = [mock_response1, mock_response2]
    mock_session_cls.return_value = mock_session

    c = RallyClient(api_key="test_key", workspace="test_workspace")
    features = c.get_features(2026, 1)
    assert len(features) == 250


@patch("rally_client.requests.Session")
def test_get_tasks_batches_story_ids(mock_session_cls):
    """Tasks should batch in groups of 20 story IDs."""
    empty_response = {"QueryResult": {"TotalResultCount": 0, "Results": []}}
    mock_session = MagicMock()
    mock_resp = MagicMock()
    mock_resp.json.return_value = empty_response
    mock_resp.raise_for_status = MagicMock()
    mock_session.get.return_value = mock_resp
    mock_session_cls.return_value = mock_session

    c = RallyClient(api_key="test_key", workspace="test_workspace")
    story_ids = [f"US-{i:03d}" for i in range(45)]
    c.get_tasks(story_ids)

    # Should have made 3 calls (20 + 20 + 5)
    assert mock_session.get.call_count == 3
