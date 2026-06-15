import pytest
from datetime import date
from decimal import Decimal
from app.utils.date_parser import parse_date
from app.utils.name_normalizer import match_to_member, normalize_name

def test_normalize_name():
    assert normalize_name(" rohan ") == "Rohan"
    assert normalize_name("priya") == "Priya"
    assert normalize_name("") == ""

def test_match_to_member():
    known_members = ["Aisha", "Rohan", "Priya", "Meera", "Dev", "Sam"]
    
    # Exact matches
    assert match_to_member("Priya", known_members) == ("Priya", "exact")
    assert match_to_member("rohan", known_members) == ("Rohan", "exact")
    
    # Fuzzy matches
    assert match_to_member("Priya S", known_members) == ("Priya", "fuzzy")
    
    # No matches
    assert match_to_member("Kabir", known_members) == (None, "none")
    assert match_to_member("Dev's friend Kabir", known_members) == (None, "none")

def test_parse_date():
    # Standard ISO
    assert parse_date("2026-02-01")[0] == date(2026, 2, 1)
    
    # DD/MM/YYYY
    assert parse_date("01/03/2026")[0] == date(2026, 3, 1)
    
    # Incomplete (No year)
    d, warnings = parse_date("Mar 14")
    assert d.month == 3 and d.day == 14
    assert any("INCOMPLETE_DATE" in w for w in warnings)
    
    # Ambiguous
    d, warnings = parse_date("04/05/2026")
    # Assuming Indian context DD/MM
    assert d == date(2026, 5, 4)
    assert any("AMBIGUOUS_DATE" in w for w in warnings)
    
    # Invalid
    d, warnings = parse_date("invalid_date")
    assert d is None
    assert any("UNPARSEABLE_DATE" in w for w in warnings)
