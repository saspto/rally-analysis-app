"""Rally (CA Agile Central) API client."""
from __future__ import annotations

import logging
from typing import Any, Generator

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://rally1.rallydev.com/slm/webservice/v2.0"
PAGE_SIZE = 200

FEATURE_FIELDS = [
    "FormattedID", "Name", "Description", "State",
    "Owner", "Owner.UserName", "Owner.EmailAddress",
    "Project", "Release", "Iteration", "PlanEstimate", "AcceptedDate",
    "CreationDate", "LastUpdateDate", "Tags", "PercentDoneByStoryCount",
    "PercentDoneByStoryPlanEstimate", "Parent",
]

STORY_FIELDS = [
    "FormattedID", "Name", "Description", "State",
    "Owner", "Owner.UserName", "Owner.EmailAddress",
    "Project", "Release", "Iteration", "PlanEstimate", "Estimate",
    "TaskEstimateTotal", "TaskActualTotal", "ScheduleState", "AcceptedDate",
    "CreationDate", "LastUpdateDate", "Tags", "Parent", "Feature",
]

TASK_FIELDS = [
    "FormattedID", "Name", "Description", "State",
    "Owner", "Owner.UserName", "Owner.EmailAddress",
    "Project", "WorkProduct", "Estimate", "Actuals", "ToDo",
    "CreationDate", "LastUpdateDate",
]

VALID_STATES = ["Defined", "In-Progress", "Completed", "Accepted"]
STORY_SCHEDULE_STATES = ["Defined", "In-Progress", "Completed", "Accepted"]


class RallyClient:
    def __init__(self, api_key: str, workspace: str) -> None:
        self.workspace = workspace
        self.session = requests.Session()
        self.session.headers.update({
            "ZSESSIONID": api_key,
            "Content-Type": "application/json",
        })

    def _fetch_all(
        self,
        endpoint: str,
        query: str,
        fields: list[str],
    ) -> Generator[dict[str, Any], None, None]:
        """Paginate through all results for a query."""
        start = 1
        while True:
            params = {
                "workspace": f"workspace/{self.workspace}",
                "query": query,
                "fetch": ",".join(fields),
                "pagesize": PAGE_SIZE,
                "start": start,
                "order": "CreationDate DESC",
            }
            response = self.session.get(f"{BASE_URL}/{endpoint}", params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            results_key = list(data.keys())[0]  # QueryResult or Results
            result_data = data.get(results_key, {})
            items: list[dict[str, Any]] = result_data.get("Results", [])
            total: int = result_data.get("TotalResultCount", 0)

            logger.debug(
                "Fetched %s: start=%d total=%d returned=%d",
                endpoint, start, total, len(items),
            )
            for item in items:
                yield item

            if start + PAGE_SIZE - 1 >= total:
                break
            start += PAGE_SIZE

    def _state_query(self, states: list[str], state_field: str = "State") -> str:
        clauses = " OR ".join(f'({state_field} = "{s}")' for s in states)
        return f"({clauses})"

    def get_features(self, fiscal_year: int, fiscal_quarter: int) -> list[dict[str, Any]]:
        """Fetch PortfolioItem/Feature items for the given FY/Q in valid states."""
        from utils import fiscal_quarter_date_range, flatten_rally_object
        start_date, end_date = fiscal_quarter_date_range(fiscal_year, fiscal_quarter)
        date_filter = (
            f'(((CreationDate >= "{start_date}T00:00:00Z") AND '
            f'(CreationDate <= "{end_date}T23:59:59Z")))'
        )
        state_filter = self._state_query(VALID_STATES)
        query = f"({date_filter} AND {state_filter})"

        features = []
        for item in self._fetch_all("portfolioitem/feature", query, FEATURE_FIELDS):
            features.append(flatten_rally_object(item, "Feature"))
        logger.info("Fetched %d features for FY%d Q%d", len(features), fiscal_year, fiscal_quarter)
        return features

    def get_user_stories(
        self,
        fiscal_year: int,
        fiscal_quarter: int,
        feature_ids: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch HierarchicalRequirement (user stories) for the given FY/Q."""
        from utils import fiscal_quarter_date_range, flatten_rally_object
        start_date, end_date = fiscal_quarter_date_range(fiscal_year, fiscal_quarter)
        date_filter = (
            f'(((CreationDate >= "{start_date}T00:00:00Z") AND '
            f'(CreationDate <= "{end_date}T23:59:59Z")))'
        )
        state_filter = self._state_query(STORY_SCHEDULE_STATES, "ScheduleState")
        query = f"({date_filter} AND {state_filter})"

        if feature_ids:
            feature_clause = " OR ".join(f'(Feature.FormattedID = "{fid}")' for fid in feature_ids)
            query = f"({query} AND ({feature_clause}))"

        stories = []
        for item in self._fetch_all("hierarchicalrequirement", query, STORY_FIELDS):
            stories.append(flatten_rally_object(item, "UserStory"))
        logger.info("Fetched %d user stories", len(stories))
        return stories

    def get_tasks(self, story_ids: list[str] | None = None) -> list[dict[str, Any]]:
        """Fetch Tasks for given user story FormattedIDs."""
        from utils import flatten_rally_object

        if not story_ids:
            logger.info("No story IDs provided; skipping task fetch")
            return []

        tasks: list[dict[str, Any]] = []
        # Rally doesn't support large OR clauses, so batch in groups of 20
        batch_size = 20
        for i in range(0, len(story_ids), batch_size):
            batch = story_ids[i : i + batch_size]
            clause = " OR ".join(f'(WorkProduct.FormattedID = "{sid}")' for sid in batch)
            query = f"({clause})"
            for item in self._fetch_all("task", query, TASK_FIELDS):
                tasks.append(flatten_rally_object(item, "Task"))

        logger.info("Fetched %d tasks", len(tasks))
        return tasks
