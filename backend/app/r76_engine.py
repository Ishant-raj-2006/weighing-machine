"""
OIML R-76 (Non-Automatic Weighing Instruments) rule engine.

This module is deliberately kept separate from the API/DB layers so that
new tests or a revised MPE table (e.g. a future OIML revision) can be
dropped in here without touching the rest of the app — this is what the
problem statement calls "supporting future updates whenever OIML
recommendations are revised."

Implements OIML R76-1:2006, Table 3 — Maximum Permissible Errors (MPE)
at initial verification, expressed in verification scale intervals (e),
as a function of accuracy class and the load expressed as a number of
intervals (m = load / e). In-service (post-installation) MPEs are twice
the initial-verification values, per R76.

PROTOTYPE NOTE: values below reproduce the standard, widely published
R76 Table 3 limits. Before this is used for anything beyond a hackathon
prototype / demo, cross-check against the current official OIML R76-1
text, since recommendations do get revised.
"""

from typing import List, Tuple

# {accuracy_class: [(upper_bound_in_e_or_None, mpe_in_e), ...]}  — bounds are inclusive
MPE_TABLE_INITIAL: dict[str, List[Tuple[float | None, float]]] = {
    "I":    [(50_000, 0.5), (200_000, 1.0), (None, 1.5)],
    "II":   [(5_000, 0.5), (20_000, 1.0), (None, 1.5)],
    "III":  [(500, 0.5), (2_000, 1.0), (None, 1.5)],
    "IIII": [(50, 0.5), (200, 1.0), (None, 1.5)],
}

VALID_CLASSES = tuple(MPE_TABLE_INITIAL.keys())
VALID_STAGES = ("initial_verification", "in_service")


class R76Error(ValueError):
    pass


def get_mpe(accuracy_class: str, load: float, e_value: float,
            stage: str = "initial_verification") -> tuple[float, float]:
    """Return (mpe_in_measurement_unit, number_of_verification_intervals)."""
    accuracy_class = (accuracy_class or "").upper()
    if accuracy_class not in MPE_TABLE_INITIAL:
        raise R76Error(f"Unknown accuracy class '{accuracy_class}'. Must be one of {VALID_CLASSES}.")
    if e_value is None or e_value <= 0:
        raise R76Error("Verification scale interval (e) must be a positive number.")
    if stage not in VALID_STAGES:
        raise R76Error(f"Unknown test stage '{stage}'. Must be one of {VALID_STAGES}.")

    m = load / e_value  # number of verification scale intervals for this load
    table = MPE_TABLE_INITIAL[accuracy_class]
    mpe_in_e = table[-1][1]
    for upper_bound, mpe_val in table:
        if upper_bound is None or m <= upper_bound:
            mpe_in_e = mpe_val
            break

    mpe = mpe_in_e * e_value
    if stage == "in_service":
        mpe *= 2

    return round(mpe, 6), round(m, 3)


def evaluate_weighing_point(test_load: float, indicated_value: float,
                             accuracy_class: str, e_value: float,
                             stage: str = "initial_verification") -> dict:
    """Single-point accuracy check: |indicated - true load| <= MPE."""
    mpe, m = get_mpe(accuracy_class, test_load, e_value, stage)
    error = round(indicated_value - test_load, 6)
    result = "PASS" if abs(error) <= mpe + 1e-9 else "FAIL"
    return {"error": error, "mpe": mpe, "verification_intervals": m, "result": result}


def evaluate_repeatability(test_load: float, readings: List[float],
                            accuracy_class: str, e_value: float,
                            stage: str = "initial_verification") -> dict:
    """
    Repeated weighings at one load. Criterion used here: the spread
    (max - min) of the readings must not exceed the MPE applicable at
    that load — a standard simplified reading of the R76 repeatability
    requirement, suitable for a prototype rule engine.
    """
    if not readings or len(readings) < 2:
        raise R76Error("Repeatability test needs at least 2 readings.")
    mpe, m = get_mpe(accuracy_class, test_load, e_value, stage)
    mean_value = round(sum(readings) / len(readings), 6)
    range_value = round(max(readings) - min(readings), 6)
    result = "PASS" if range_value <= mpe + 1e-9 else "FAIL"
    return {"mean_value": mean_value, "range_value": range_value, "mpe": mpe, "result": result}


def evaluate_eccentricity(test_load: float, indicated_value: float,
                           accuracy_class: str, e_value: float,
                           stage: str = "initial_verification") -> dict:
    """Off-centre (corner) load check — same MPE rule as a single weighing point."""
    return evaluate_weighing_point(test_load, indicated_value, accuracy_class, e_value, stage)
