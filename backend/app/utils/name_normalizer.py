from typing import Tuple, Optional, List

KNOWN_MEMBERS = ["Aisha", "Rohan", "Priya", "Meera", "Dev", "Sam"]

def normalize_name(raw: str) -> str:
    """
    Strips leading/trailing whitespace and converts to Title Case.
    """
    if not raw:
        return ""
    return str(raw).strip().title()

def match_to_member(name: str, known_members: List[str] = None) -> Tuple[Optional[str], str]:
    """
    Attempts to match a name to the list of known members.
    Returns: (matched_canonical_name, confidence)
    Confidence can be: 'exact', 'fuzzy', or 'none'.
    """
    if known_members is None:
        known_members = KNOWN_MEMBERS
        
    normalized = normalize_name(name)
    if not normalized:
        return None, "none"
        
    # Map normalized versions of known members to their canonical original strings
    norm_known = {normalize_name(k): k for k in known_members}
    
    # 1. Exact Match (case-insensitive & whitespace agnostic due to normalize_name)
    if normalized in norm_known:
        return norm_known[normalized], "exact"
        
    # 2. Fuzzy Match (starts with match)
    # Sort by longest known members first to avoid subset false positives
    for k_norm, k_orig in sorted(norm_known.items(), key=lambda x: len(x[0]), reverse=True):
        # We check startswith(k_norm + " ") to ensure distinct word boundaries.
        # This matches "Priya S" to "Priya", but prevents "Dev's friend" from fuzzy matching "Dev"
        if normalized.startswith(k_norm + " "):
            return k_orig, "fuzzy"
            
    # 3. No Match
    return None, "none"
