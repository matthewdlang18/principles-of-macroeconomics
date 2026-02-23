#!/usr/bin/env python3
"""
Create updated slides 26-33 for Lecture 12 with current FRED and CBO data
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Slide dimensions (16:9 aspect ratio)
WIDTH = 1920
HEIGHT = 1080

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (0, 51, 141)
RED = (178, 24, 43)
GRAY = (128, 128, 128)
LIGHT_GRAY = (240, 240, 240)
DARK_BLUE = (0, 35, 102)
GOLD = (218, 165, 32)

def create_slide(title, content_lines, output_path, subtitle=None):
    """Create a slide with title and content"""
    img = Image.new('RGB', (WIDTH, HEIGHT), WHITE)
    draw = ImageDraw.Draw(img)
    
    # Draw header bar
    draw.rectangle([(0, 0), (WIDTH, 120)], fill=DARK_BLUE)
    
    # Fonts
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
    except:
        title_font = ImageFont.load_default()
    
    try:
        content_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except:
        content_font = ImageFont.load_default()
    
    try:
        small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    except:
        small_font = ImageFont.load_default()
    
    # Draw title
    draw.text((60, 35), title, fill=WHITE, font=title_font)
    
    # Subtitle
    if subtitle:
        draw.text((60, 90), subtitle, fill=GOLD, font=small_font)
    
    # Content
    y_pos = 160
    for line in content_lines:
        draw.text((60, y_pos), line, fill=BLACK, font=content_font)
        y_pos += 45
    
    # Save as PNG
    img.save(output_path, "PNG")
    print(f"Created: {output_path}")

# Slide 26
slide26_content = [
    "FEDERAL DEFICIT OVER TIME",
    "",
    "Historical Context:",
    "• FY2020: $3.3 trillion (16% GDP) - COVID-19 pandemic response",
    "• FY2021-FY2022: Elevated deficits due to pandemic relief",
    "• FY2024: $1.6 trillion (5.6% of GDP) - CBO Estimate",
    "• FY2025: $1.7+ trillion (6.1% of GDP) - CBO Projection",
    "",
    "CBO Projections:",
    "• FY2034: $2.6 trillion deficit projected",
    "• Deficits will remain elevated through 2034",
    "",
    "Source: Congressional Budget Office (CBO), February 2024",
]
create_slide("Federal Deficit over Time", slide26_content, 
             "lecture_slides/slide26_deficit.png",
             "Data: CBO Budget and Economic Outlook 2024-2034")

# Slide 27
slide27_content = [
    "FEDERAL DEFICIT DATA (as % of GDP)",
    "",
    "Historical Deficits:",
    "• 2000: 2.3%  • 2008: 3.1%  • 2009: 9.8% (Great Recession)",
    "• 2010: 8.6%  • 2015: 2.4%  • 2019: 4.6%",
    "• 2020: 14.9%  • 2021: 11.8%  • 2022: 5.4%",
    "",
    "CBO Projections (February 2024):",
    "• 2024: 5.6%  • 2025: 6.1%  • 2026: 5.8%",
    "• 2027: 5.4%  • 2028-2034: Rising to 6.1%",
    "",
    "Note: Pre-pandemic average (2010-2019): 4.2% of GDP",
    "",
    "Source: Congressional Budget Office, Treasury Department",
]
create_slide("Federal Deficit over Time", slide27_content,
             "lecture_slides/slide27_deficit_data.png",
             "Data: CBO, Treasury")

# Slide 28
slide28_content = [
    "FEDERAL OUTLAYS AND REVENUES (FY2024)",
    "",
    "Total Outlays: $6.8 trillion",
    "",
    "Major Spending Categories:",
    "• Social Security: $1.4 trillion (21%)",
    "• Medicare & Medicaid: $1.3 trillion (19%)",
    "• Defense: $886 billion (13%)",
    "• Interest on Debt: $950+ billion (14%)",
    "• Other Mandatory: $700 billion (10%)",
    "• Discretionary (non-defense): $840 billion (12%)",
    "",
    "Total Revenue: $4.9 trillion",
    "• Individual Income Taxes: $2.4 trillion (49%)",
    "• Payroll Taxes: $1.6 trillion (33%)",
    "• Corporate Taxes: $420 billion (9%)",
    "• Other: $480 billion (9%)",
    "",
    "Source: CBO, Treasury Department, OMB Historical Tables",
]
create_slide("Federal Outlays and Revenues", slide28_content,
             "lecture_slides/slide28_outlays.png",
             "Data: FY2024 Federal Budget")

# Slide 29
slide29_content = [
    "FEDERAL OUTLAYS AND REVENUES - HISTORICAL",
    "",
    "Revenue as % of GDP (1950-2024):",
    "• 1950: 14.0%  • 1970: 17.0%  • 1990: 17.0%",
    "• 2000: 20.0%  • 2010: 15.0%  • 2020: 16.0%",
    "• 2024: ~17.0%",
    "",
    "Outlays as % of GDP (1950-2024):",
    "• 1950: 15.0%  • 1970: 19.0%  • 1990: 21.0%",
    "• 2000: 18.0%  • 2010: 24.0%  • 2020: 31.0%",
    "• 2024: ~24.0%",
    "",
    "Key Trend: Gap between spending and revenue",
    "• Pre-pandemic (2019): 4.6% deficit",
    "• COVID peak (2020): 14.9% deficit",
    "• Current: 5.6% deficit",
    "",
    "Source: CBO, OMB Historical Tables",
]
create_slide("Federal Outlays and Revenues", slide29_content,
             "lecture_slides/slide29_outlays_historical.png",
             "Historical Trends: 1950-2024")

# Slide 30
slide30_content = [
    "NET INTEREST ON DEBT",
    "",
    "Current Interest Payments (FY2024):",
    "• Total Interest: ~$950 billion",
    "• As % of GDP: ~3.5%",
    "• As % of Federal Revenue: ~19%",
    "",
    "Historical Context:",
    "• FY2000: $223 billion (2.3% of spending)",
    "• FY2010: $196 billion (1.7% of spending)",
    "• FY2020: $345 billion (2.2% of spending)",
    "• FY2022: $475 billion (1.9% of GDP)",
    "• FY2024: ~$950 billion (3.5% of GDP)",
    "",
    "Critical Development (2024):",
    "• Interest payments now EXCEED defense spending",
    "• Interest payments now EXCEED Medicare spending",
    "",
    "Source: CBO, Treasury Department",
]
create_slide("Net Interest on Debt", slide30_content,
             "lecture_slides/slide30_interest.png",
             "Rising Interest Burden")

# Slide 31
slide31_content = [
    "NET INTEREST VS. DEFENSE SPENDING",
    "",
    "Historical Comparison (% of GDP):",
    "• 1990: Interest 3.2%, Defense 5.2%",
    "• 2000: Interest 2.3%, Defense 3.0%",
    "• 2010: Interest 1.5%, Defense 4.8%",
    "• 2020: Interest 1.3%, Defense 3.7%",
    "",
    "2024 Turning Point:",
    "• Interest Payments: ~$950 billion (3.5% GDP)",
    "• Defense Spending: ~$886 billion (3.2% GDP)",
    "• Interest > Defense for first time in modern history",
    "",
    "Why Interest is Growing Faster:",
    "1. Higher debt levels",
    "2. Higher interest rates (post-pandemic)",
    "3. Rolling over older debt at higher rates",
    "",
    "CBO Projection: Interest will reach 7.2% of GDP by 2054",
    "",
    "Source: CBO Budget Outlook 2024",
]
create_slide("Net Interest vs. Defense Spending", slide31_content,
             "lecture_slides/slide31_interest_defense.png",
             "A Historic Shift in Federal Spending")

# Slide 32
slide32_content = [
    "HOW BIG IS THE NATIONAL DEBT?",
    "",
    "Current Total (as of late 2025):",
    "• Total National Debt: $38+ TRILLION",
    "• Debt Held by Public: ~$29 trillion",
    "• Intragovernmental Holdings: ~$7-8 trillion",
    "",
    "Debt-to-GDP Ratio:",
    "• 2024: 99% of GDP",
    "• 2034 (projected): 116% of GDP",
    "• 2054 (projected): 172% of GDP",
    "",
    "Per Capita:",
    "• Total debt ÷ 335 million Americans",
    "• ≈ $113,000+ per person",
    "",
    "Growth Milestones:",
    "• 2008: $10 trillion",
    "• 2017: $20 trillion",
    "• 2022: $30 trillion",
    "• 2024: $34+ trillion",
    "• 2025: $38 trillion",
    "",
    "Sources: Treasury Department, CBO, Wikipedia",
]
create_slide("How Big is the National Debt?", slide32_content,
             "lecture_slides/slide32_debt_size.png",
             "Data: Treasury, CBO, 2024-2025")

# Slide 33
slide33_content = [
    "NATIONAL DEBT FACTS",
    "",
    "Fact #1: Public vs. Intragovernmental Debt",
    "• Public Debt (held by investors): ~$29 trillion",
    "• Intragovernmental (Social Security, etc.): ~$7-8 trillion",
    "• Total: ~$38 trillion",
    "",
    "Fact #2: Debt Held by Public as % GDP",
    "• 1980: 26%  • 1995: 49%  • 2007: 36%",
    "• 2020: 100%  • 2024: 99%  • 2034: 116% (projected)",
    "",
    "Fact #3: Foreign Ownership",
    "• Foreign governments hold ~$7 trillion of US debt",
    "• Top holders: Japan, China, UK",
    "• ~33% of publicly held debt",
    "",
    "Fact #4: Interest Costs Rising",
    "• 2024: $950 billion (14% of budget)",
    "• 2034: Projected to exceed $1.5 trillion",
    "",
    "CBO Warning: Without policy changes, debt will grow",
    "unsustainably, reaching 172% of GDP by 2054",
    "",
    "Sources: CBO, Treasury Department, BEA",
]
create_slide("National Debt Facts", slide33_content,
             "lecture_slides/slide33_debt_facts.png",
             "Key Statistics and Trends")

print("\n✅ All slides created successfully!")
print("Output files in: lecture_slides/")
