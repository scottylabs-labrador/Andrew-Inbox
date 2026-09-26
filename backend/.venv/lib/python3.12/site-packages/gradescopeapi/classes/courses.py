from dataclasses import dataclass


@dataclass
class Course:
    name: str
    full_name: str
    semester: str
    year: str
    num_grades_published: str  # no longer available from course homepage
    num_assignments: str
