"""Tests for utils.py."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../lambda"))

import pytest
from datetime import date
from unittest.mock import MagicMock, patch
from utils import get_fiscal_year_quarter, fiscal_quarter_date_range, flatten_rally_object


class TestGetFiscalYearQuarter:
    # FY starts Oct 1, ends Sep 30. FY label = calendar year the FY ends.
    # Q1 = Oct–Dec (prior CY), Q2 = Jan–Mar, Q3 = Apr–Jun, Q4 = Jul–Sep

    def test_october_is_fy_q1(self):
        # Oct 2025 → FY2026 Q1
        assert get_fiscal_year_quarter(date(2025, 10, 1)) == (2026, 1)

    def test_december_is_fy_q1(self):
        assert get_fiscal_year_quarter(date(2025, 12, 31)) == (2026, 1)

    def test_january_is_fy_q2(self):
        assert get_fiscal_year_quarter(date(2026, 1, 1)) == (2026, 2)

    def test_march_is_fy_q2(self):
        assert get_fiscal_year_quarter(date(2026, 3, 31)) == (2026, 2)

    def test_april_is_fy_q3(self):
        assert get_fiscal_year_quarter(date(2026, 4, 1)) == (2026, 3)

    def test_june_is_fy_q3(self):
        assert get_fiscal_year_quarter(date(2026, 6, 30)) == (2026, 3)

    def test_july_is_fy_q4(self):
        assert get_fiscal_year_quarter(date(2026, 7, 1)) == (2026, 4)

    def test_september_is_fy_q4(self):
        assert get_fiscal_year_quarter(date(2026, 9, 30)) == (2026, 4)

    def test_fy_boundary_oct_starts_next_fy(self):
        # Oct 1 2026 starts FY2027 Q1
        assert get_fiscal_year_quarter(date(2026, 10, 1)) == (2027, 1)


class TestFiscalQuarterDateRange:
    def test_q1_spans_oct_dec_prior_year(self):
        # FY2026 Q1 = Oct 1 2025 – Dec 31 2025
        start, end = fiscal_quarter_date_range(2026, 1)
        assert start == date(2025, 10, 1)
        assert end == date(2025, 12, 31)

    def test_q2_spans_jan_mar(self):
        start, end = fiscal_quarter_date_range(2026, 2)
        assert start == date(2026, 1, 1)
        assert end == date(2026, 3, 31)

    def test_q3_spans_apr_jun(self):
        start, end = fiscal_quarter_date_range(2026, 3)
        assert start == date(2026, 4, 1)
        assert end == date(2026, 6, 30)

    def test_q4_spans_jul_sep(self):
        start, end = fiscal_quarter_date_range(2026, 4)
        assert start == date(2026, 7, 1)
        assert end == date(2026, 9, 30)


class TestFlattenRallyObject:
    def test_owner_expanded_to_three_columns(self):
        obj = {
            "FormattedID": "F-001",
            "Name": "Auth Feature",
            "Owner": {
                "_refObjectName": "Jane Doe",
                "UserName": "jdoe",
                "EmailAddress": "jdoe@example.com",
            },
            "State": "Completed",
        }
        flat = flatten_rally_object(obj, "Feature")
        assert flat["OwnerName"] == "Jane Doe"
        assert flat["OwnerUserName"] == "jdoe"
        assert flat["OwnerEmail"] == "jdoe@example.com"
        # Raw "Owner" key should not appear as a raw dict
        assert "Owner" not in flat

    def test_owner_partial_data(self):
        # Rally sometimes omits UserName/EmailAddress
        obj = {"Owner": {"_refObjectName": "Bob Smith"}}
        flat = flatten_rally_object(obj, "UserStory")
        assert flat["OwnerName"] == "Bob Smith"
        assert flat["OwnerUserName"] == ""
        assert flat["OwnerEmail"] == ""

    def test_skips_underscore_keys(self):
        obj = {"_rallyAPIMajor": "2", "FormattedID": "US-001", "_ref": "http://...", "_type": "HierarchicalRequirement"}
        flat = flatten_rally_object(obj, "UserStory")
        assert "_rallyAPIMajor" not in flat
        assert "_type" not in flat

    def test_joins_list_values(self):
        obj = {"Tags": ["tag1", "tag2"]}
        flat = flatten_rally_object(obj, "Feature")
        assert flat["Tags"] == "tag1, tag2"

    def test_nested_non_owner_ref_extracts_name(self):
        obj = {"Project": {"_refObjectName": "Platform Team"}}
        flat = flatten_rally_object(obj, "Feature")
        assert flat["Project"] == "Platform Team"
