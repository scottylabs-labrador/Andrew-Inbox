"""Functions for modifying assignment details."""

import datetime
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup
from requests_toolbelt.multipart.encoder import MultipartEncoder

from gradescopeapi import DEFAULT_GRADESCOPE_BASE_URL


class AssignmentUpdateError(Exception):
    pass


class InvalidTitleName(AssignmentUpdateError):
    pass


@dataclass
class Assignment:
    assignment_id: str
    name: str
    release_date: datetime.datetime
    due_date: datetime.datetime
    late_due_date: datetime.datetime
    submissions_status: str
    grade: str
    max_grade: str


def update_assignment_date(
    session: requests.Session,
    course_id: str,
    assignment_id: str,
    release_date: datetime.datetime | None = None,
    due_date: datetime.datetime | None = None,
    late_due_date: datetime.datetime | None = None,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
) -> bool:
    """Update the dates of an assignment on Gradescope.

    Args:
        session (requests.Session): The session object for making HTTP requests.
        course_id (str): The ID of the course.
        assignment_id (str): The ID of the assignment.
        release_date (datetime.datetime | None, optional): The release date of the assignment. Defaults to None.
        due_date (datetime.datetime | None, optional): The due date of the assignment. Defaults to None.
        late_due_date (datetime.datetime | None, optional): The late due date of the assignment. Defaults to None.

    Notes:
        The timezone for dates used in Gradescope is specific to an institution. For example, for NYU, the timezone is America/New_York.
        For datetime objects passed to this function, the timezone should be set to the institution's timezone.

    Raises if session does not have access to configure assignment.

    Returns:
        bool: True if the assignment dates were successfully updated, False otherwise.
    """
    GS_EDIT_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}/edit"
    )
    GS_POST_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}"
    )

    # Get auth token
    response = session.get(GS_EDIT_ASSIGNMENT_ENDPOINT)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    auth_token = soup.select_one('input[name="authenticity_token"]')["value"]

    # Setup multipart form data
    multipart = MultipartEncoder(
        fields={
            "utf8": "✓",
            "_method": "patch",
            "authenticity_token": auth_token,
            "assignment[release_date_string]": (
                release_date.strftime("%Y-%m-%dT%H:%M") if release_date else ""
            ),
            "assignment[due_date_string]": (
                due_date.strftime("%Y-%m-%dT%H:%M") if due_date else ""
            ),
            "assignment[allow_late_submissions]": "1" if late_due_date else "0",
            "assignment[hard_due_date_string]": (
                late_due_date.strftime("%Y-%m-%dT%H:%M") if late_due_date else ""
            ),
            "commit": "Save",
        }
    )
    headers = {
        "Content-Type": multipart.content_type,
        "Referer": GS_EDIT_ASSIGNMENT_ENDPOINT,
    }

    response = session.post(
        GS_POST_ASSIGNMENT_ENDPOINT, data=multipart, headers=headers
    )
    response.raise_for_status()

    return response.status_code == 200


def update_assignment_title(
    session: requests.Session,
    course_id: str,
    assignment_id: str,
    assignment_name: str,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
) -> bool:
    """Update the dates of an assignment on Gradescope.

    Args:
        session (requests.Session): The session object for making HTTP requests.
        course_id (str): The ID of the course.
        assignment_id (str): The ID of the assignment.
        assignment_name (str): The name of the assignment to update to.

    Notes:
        Assignment name cannot be all whitespace

    Raises if session does not have access to configure assignment.

    Returns:
        bool: True if the assignment dates were successfully updated, False otherwise.
    """
    GS_EDIT_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}/edit"
    )
    GS_POST_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}"
    )

    # Get auth token
    response = session.get(GS_EDIT_ASSIGNMENT_ENDPOINT)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    auth_token = soup.select_one('input[name="authenticity_token"]')["value"]

    # Setup multipart form data
    multipart = MultipartEncoder(
        fields={
            "utf8": "✓",
            "_method": "patch",
            "authenticity_token": auth_token,
            "assignment[title]": assignment_name,
            "commit": "Save",
        }
    )
    headers = {
        "Content-Type": multipart.content_type,
        "Referer": GS_EDIT_ASSIGNMENT_ENDPOINT,
    }

    response = session.post(
        GS_POST_ASSIGNMENT_ENDPOINT, data=multipart, headers=headers
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.content, "html.parser")
    error = soup.select_one(".form--requiredFieldStar.error")
    if error is not None:
        if error.parent is not None and error.parent.text.startswith("Title"):
            raise InvalidTitleName(f"Assignment title '{assignment_name}' is invalid")
        else:
            raise AssignmentUpdateError(
                "Unknown error occurred trying to update assignment title"
            )

    return response.status_code == 200


def update_autograder_image_name(
    session: requests.Session,
    course_id: str,
    assignment_id: str,
    image_name: str,
    gradescope_base_url: str = DEFAULT_GRADESCOPE_BASE_URL,
) -> bool:
    """Update the Docker Hub image name of an assignment on Gradescope.

    Args:
        session (requests.Session): The session object for making HTTP requests.
        course_id (str): The ID of the course.
        assignment_id (str): The ID of the assignment.
        image_name (str): The Docker Hub Image Name (user-handle/repo:tag)

    Notes:
        In most cases Gradescope does not validate that the image_name provided exists on Docker Hub. Garbage
        values may still successfully return OK. You should test your autograder after updating the image name
        to ensure it works as expected.

        Example image name: 'gradescope/autograder-base:ubuntu-22.04'
        from https://hub.docker.com/layers/gradescope/autograder-base/ubuntu-22.04

    Raises if session does not have access to configure autograder or if assignment does not have an autograder.

    Returns:
        bool: True if the image name was successfully updated, False otherwise.
    """
    GS_EDIT_AUTOGRADER_ASSIGNMENT_ENDPOINT = f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}/configure_autograder"
    GS_POST_ASSIGNMENT_ENDPOINT = (
        f"{gradescope_base_url}/courses/{course_id}/assignments/{assignment_id}"
    )

    # Get auth token
    response = session.get(GS_EDIT_AUTOGRADER_ASSIGNMENT_ENDPOINT)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    auth_token = soup.select_one('input[name="authenticity_token"]')["value"]

    # Setup multipart form data
    multipart = MultipartEncoder(
        fields={
            "utf8": "✓",
            "_method": "patch",
            "authenticity_token": auth_token,
            "source_page": "configure_autograder",
            "assignment[image_name]": image_name,
        }
    )
    headers = {
        "Content-Type": multipart.content_type,
        "Referer": GS_EDIT_AUTOGRADER_ASSIGNMENT_ENDPOINT,
    }

    response = session.post(
        GS_POST_ASSIGNMENT_ENDPOINT, data=multipart, headers=headers
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.content, "html.parser")
    return response.status_code == 200 and not soup.find(
        string="Docker image not found in your current course!"
    )
