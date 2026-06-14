import pytest
from datetime import date
from app.utils.date_parser import parse_date

def test_iso_format():
    d, w = parse_date("2026-02-01")
    assert d == date(2026, 2, 1)
    assert len(w) == 0

def test_dd_mm_yyyy_unambiguous_day_first():
    # 25 is day, 03 is month
    d, w = parse_date("25/03/2026")
    assert d == date(2026, 3, 25)
    assert len(w) == 0

def test_dd_mm_yyyy_unambiguous_month_first():
    # 03 is month, 25 is day
    d, w = parse_date("03/25/2026")
    assert d == date(2026, 3, 25)
    assert len(w) == 0

def test_dd_mm_yyyy_ambiguous():
    # 04/05/2026 -> May 4 (DD/MM/YYYY)
    d, w = parse_date("04/05/2026")
    assert d == date(2026, 5, 4)
    assert len(w) == 1
    assert "interpreted as DD/MM/YYYY (May 4)" in w[0]
    assert "Could also be April 5" in w[0]

def test_dd_mm_yyyy_same_day_month():
    # 03/03/2026 -> March 3, unambiguous because values are the same
    d, w = parse_date("03/03/2026")
    assert d == date(2026, 3, 3)
    assert len(w) == 0

def test_mon_dd_no_year():
    d, w = parse_date("Mar 14")
    assert d == date(2026, 3, 14)
    assert len(w) == 1
    assert w[0] == "INCOMPLETE_DATE: 'Mar 14' has no year. Assumed 2026."

def test_mon_dd_trailing_comma():
    d, w = parse_date("Mar 14,")
    assert d == date(2026, 3, 14)
    assert len(w) == 1
    assert w[0] == "INCOMPLETE_DATE: 'Mar 14,' has no year. Assumed 2026."

def test_mon_dd_custom_context_year():
    d, w = parse_date("Dec 31", context_year=2025)
    assert d == date(2025, 12, 31)
    assert len(w) == 1
    assert w[0] == "INCOMPLETE_DATE: 'Dec 31' has no year. Assumed 2025."

def test_unparseable_random_string():
    d, w = parse_date("Hello World")
    assert d is None
    assert len(w) == 1
    assert "could not be parsed" in w[0]

def test_unparseable_invalid_date():
    # Matches format but invalid date (Feb 30)
    d, w = parse_date("30/02/2026")
    assert d is None
    assert len(w) == 1
    assert "could not be parsed" in w[0]
