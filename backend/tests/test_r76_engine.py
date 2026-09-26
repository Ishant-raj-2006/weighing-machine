import pytest
from app.r76_engine import get_mpe, evaluate_weighing_point, evaluate_repeatability, evaluate_eccentricity, R76Error

def test_get_mpe_class_iii():
    mpe, m = get_mpe("III", 100, 1)
    assert mpe == 0.5
    assert m == 100.0

    mpe, m = get_mpe("III", 1000, 1)
    assert mpe == 1.0
    assert m == 1000.0

    mpe, m = get_mpe("III", 3000, 1)
    assert mpe == 1.5
    assert m == 3000.0

def test_get_mpe_in_service():
    mpe, m = get_mpe("III", 1000, 1, stage="in_service")
    assert mpe == 2.0
    assert m == 1000.0

def test_invalid_class():
    with pytest.raises(R76Error):
        get_mpe("V", 100, 1)

def test_evaluate_weighing_point():
    res = evaluate_weighing_point(1000, 1001, "III", 1)
    assert res["result"] == "PASS"

    res2 = evaluate_weighing_point(1000, 1001.5, "III", 1)
    assert res2["result"] == "FAIL"

def test_evaluate_repeatability():
    res = evaluate_repeatability(1000, [1000, 1000.5, 1001], "III", 1)
    # Range is 1.0, MPE is 1.0 -> PASS
    assert res["result"] == "PASS"

    res2 = evaluate_repeatability(1000, [1000, 1000.5, 1001.5], "III", 1)
    # Range is 1.5, MPE is 1.0 -> FAIL
    assert res2["result"] == "FAIL"
