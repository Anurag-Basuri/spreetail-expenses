import re
from datetime import date
from typing import Tuple, List, Optional

def parse_date(raw: str, context_year: int = 2026) -> Tuple[Optional[date], List[str]]:
    warnings = []
    
    if raw is None or not str(raw).strip():
        warnings.append(f"UNPARSEABLE_DATE: '{raw}' could not be parsed. Row skipped.")
        return None, warnings
        
    s = str(raw).strip()
    month_names = ["", "January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"]
    
    # 1. Try ISO format: YYYY-MM-DD
    iso_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", s)
    if iso_match:
        try:
            year, month, day = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
            return date(year, month, day), warnings
        except ValueError:
            pass 
            
    # 2. Try DD/MM/YYYY or MM/DD/YYYY
    slash_match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if slash_match:
        p1, p2, year = int(slash_match.group(1)), int(slash_match.group(2)), int(slash_match.group(3))
        
        could_be_dd_mm = (1 <= p1 <= 31) and (1 <= p2 <= 12)
        could_be_mm_dd = (1 <= p1 <= 12) and (1 <= p2 <= 31)
        
        if could_be_dd_mm and could_be_mm_dd and p1 != p2:
            warnings.append(f"AMBIGUOUS_DATE: '{raw}' interpreted as DD/MM/YYYY ({month_names[p2]} {p1}). Could also be {month_names[p1]} {p2} (MM/DD/YYYY). Verify.")
            day, month = p1, p2
        elif could_be_dd_mm:
            day, month = p1, p2
        elif could_be_mm_dd:
            month, day = p1, p2
        else:
            warnings.append(f"UNPARSEABLE_DATE: '{raw}' could not be parsed. Row skipped.")
            return None, warnings
            
        try:
            return date(year, month, day), warnings
        except ValueError:
            pass

    # 3. Try "Mon DD" or "Mon DD," patterns
    mon_match = re.match(r"^([a-zA-Z]{3})\s+(\d{1,2}),?$", s)
    if mon_match:
        mon_str, day_str = mon_match.group(1).lower(), mon_match.group(2)
        months = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        
        if mon_str in months:
            month = months[mon_str]
            day = int(day_str)
            try:
                parsed = date(context_year, month, day)
                warnings.append(f"INCOMPLETE_DATE: '{raw}' has no year. Assumed {context_year}.")
                return parsed, warnings
            except ValueError:
                pass
                
    warnings.append(f"UNPARSEABLE_DATE: '{raw}' could not be parsed. Row skipped.")
    return None, warnings
