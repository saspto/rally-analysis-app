"""Tests for utils.py."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../lambda"))

import pytest
from datetime import date
from unittest.mock import MagicMock, patch
from utils import get_fiscal_year_quarter, fiscal_quarter_date_range, flatten_rally_object


class TestGetFiscalYearQuarter:
    def test_february_is_q1(self):
        assert get_fiscal_year_quarter(date(2026, 2, 1)) == (2026, 1)

    def test_april_is_q1(self):
        assert get_fiscal_year_quarter(date(2026, 4, 30)) == (2026, 1)

    def test_may_is_q2(self):
        assert get_fiscal_year_quarter(date(2026, 5, 1)) == (2026, 2)

    def test_july_is_q2(self):
        assert get_fiscal_year_quarter(date(2026, 7, 31)) == (2026, 2)

    def test_august_is_q3(self):
        assert get_fiscal_year_quarter(date(2026, 8, 1)) == (2026, 3)

    def test_october_is_q3(self):
        assert get_fiscal_year_quarter(date(2026, 10, 31)) == (2026, 3)

    def test_november_is_q4(self):
        assert get_fiscal_year_quarter(date(2026, 11, 1)) == (2026, 4)

    def test_december_is_q4(self):
        assert get_fiscal_year_quarter(date(2026, 12, 15)) == (2026, 4)

    def test_january_is_q4_prior_fy(self):
        # January 2026 is Q4 of FY2026
        assert get_fiscal_year_quarter(date(2026, 1, 15)) == (2026, 4)


class TestFiscalQuarterDateRange:
    def test_q1_range(self):
        start, end = fiscal_quarter_date_range(2026, 1)
        assert start == date(2026, 2, 1)
        assert end == date(2026, 4, 30)

    def test_q4_range_crosses_year(self):
        start, end = fiscal_quarter_date_range(2026, 4)
        assert start == date(2026, 11, 1)
        assert end == date(2027, 1, 31)


class TestFlattenRallyObject:
    def test_flattens_nested_ref(self):
        obj = {
            "FormattedID": "F-001",
            "Name": "Auth Feature",
            "Owner": {"_refObjectName": "Jane Doe"},
            "State": "Completed",
        }
        flat = flatten_rally_object(obj, "Feature")
        assert flat["Type"] == "Feature"
        assert flat["FormattedID"] == "F-001"
        assert flat["Owner"] == "Jane Doe"

    def test_skips_underscore_keys(self):
        obj = {"_rallyAPIMajor": "2", "FormattedID": "US-001", "_ref": "http://...", "_type": "HierarchicalRequirement"}
        flat = flatten_rally_object(obj, "UserStory")
        assert "_rallyAPIMajor" not in flat
        assert "_type" not in flat

    def test_joins_list_values(self):
        obj = {"Tags": ["tag1", "tag2"]}
        flat = flatten_rally_object(obj, "Feature")
        assert flat["Tags"] == "tag1, tag2"
