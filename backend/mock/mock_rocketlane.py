import hashlib

from models.schemas import OnboardingProject


def _seed(customer_id: str) -> int:
    return int(hashlib.md5(customer_id.encode()).hexdigest()[:8], 16)


_PHASES = ["Discovery", "Configuration", "Integration", "Testing", "Go-Live", "Completed"]
_STATUSES = ["On Track", "At Risk", "Behind Schedule", "Completed"]


def get_onboarding(customer_id: str) -> list[OnboardingProject]:
    s = _seed(customer_id)
    num_projects = 1 + (s % 3)
    projects = []
    for i in range(num_projects):
        ps = (s + i * 31) % 100
        phase_idx = min((s + i * 7) % len(_PHASES), len(_PHASES) - 1)
        status_idx = 3 if phase_idx == 5 else min((s + i * 13) % 3, 2)
        pct = 100 if phase_idx == 5 else min(10 + ps, 95)
        day = 1 + ((s + i * 5) % 28)
        month = 3 + ((s + i) % 10)
        year = 2026 if month <= 12 else 2027
        month = month if month <= 12 else month - 12
        projects.append(
            OnboardingProject(
                project_name=f"{'Phase ' + str(i + 1) + ' - ' if num_projects > 1 else ''}Platform Onboarding",
                status=_STATUSES[status_idx],
                phase=_PHASES[phase_idx],
                percent_complete=pct,
                due_date=f"{year}-{month:02d}-{day:02d}",
            )
        )
    return projects
