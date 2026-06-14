import pytest
from app.utils.name_normalizer import normalize_name, match_to_member

def test_normalize_name():
    assert normalize_name("Priya") == "Priya"
    assert normalize_name("priya") == "Priya"
    assert normalize_name("rohan ") == "Rohan"
    assert normalize_name("  Dev  ") == "Dev"
    assert normalize_name("Priya S") == "Priya S"
    assert normalize_name("Dev's friend Kabir") == "Dev'S Friend Kabir"

def test_match_exact_correct():
    name, conf = match_to_member("Priya")
    assert name == "Priya"
    assert conf == "exact"

def test_match_exact_lowercase():
    name, conf = match_to_member("priya")
    assert name == "Priya"
    assert conf == "exact"

def test_match_exact_trailing_space():
    name, conf = match_to_member("rohan ")
    assert name == "Rohan"
    assert conf == "exact"

def test_match_fuzzy_initial():
    name, conf = match_to_member("Priya S")
    assert name == "Priya"
    assert conf == "fuzzy"

def test_match_fuzzy_initial_lowercase():
    name, conf = match_to_member("priya s")
    assert name == "Priya"
    assert conf == "fuzzy"

def test_match_exact_guest_member():
    name, conf = match_to_member("Dev")
    assert name == "Dev"
    assert conf == "exact"

def test_match_none_non_member():
    # Should not fuzzy match Dev because it's Dev's (no space boundary after Dev)
    name, conf = match_to_member("Dev's friend Kabir")
    assert name is None
    assert conf == "none"

def test_match_none_unknown_completely():
    name, conf = match_to_member("Random Person")
    assert name is None
    assert conf == "none"

def test_match_custom_known_members():
    name, conf = match_to_member("Bob T", known_members=["Bob", "Alice"])
    assert name == "Bob"
    assert conf == "fuzzy"

def test_match_empty_string():
    name, conf = match_to_member("")
    assert name is None
    assert conf == "none"
