from dataclasses import dataclass


@dataclass
class Member:
    full_name: str
    first_name: str
    last_name: str
    sid: str
    email: str
    role: str
    user_id: (
        str | None
    )  # used for modifying extensions, only present for 'student' accounts in a course
    num_submissions: int
    sections: str
    course_id: str
