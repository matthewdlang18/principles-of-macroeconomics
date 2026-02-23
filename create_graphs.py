#!/usr/bin/env python3
"""
Create updated slides 26-33 for Lecture 12 with graphs and charts
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

# Colors to match the lecture style
COLORS = {
    'blue': '#003386',
    'red': '#B21B2B',
    'gray': '#808080',
    'light_gray': '#D3D3D3',
    'gold': '#DAA520',
    'green': '#228B22',
    'orange': '#FF8C00'
}

CBO_BLUE = '#003386'
CBO_RED = '#B21B2B'

# ===== SLIDE 26: Federal Deficit - DUAL AXIS (Nominal + % GDP) =====
def create_slide26():
    fig, ax1 = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    # Data
    years = [2000, 2005, 2010, 2015, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034]
    
    # Nominal deficit in billions
    deficit_nominal = [150, 400, 1300, 400, 980, 3200, 2800, 1400, 1700, 1600, 1700, 1500, 1200, 1300, 1400, 1500, 1600, 1700, 1700, 1800]
    
    # Deficit as % of GDP
    deficit_pct = [2.3, 3.6, 8.6, 2.4, 4.6, 14.9, 11.8, 5.4, 6.2, 5.6, 6.1, 5.8, 5.4, 5.6, 5.8, 6.0, 6.1, 6.1, 6.1, 6.1]
    
    # Historical vs Projected split
    hist_years = years[:10]
    proj_years = years[9:]
    
    # Primary axis: Nominal deficit (bar chart)
    color1 = CBO_BLUE
    ax1.set_xlabel('Fiscal Year', fontsize=12)
    ax1.set_ylabel('Deficit (Billions $)', color=color1, fontsize=12)
    bars = ax1.bar(years, deficit_nominal, color=color1, alpha=0.4, label='Nominal Deficit ($B)', width=0.8)
    ax1.tick_params(axis='y', labelcolor=color1)
    ax1.set_ylim(0, 4000)
    
    # Secondary axis: Deficit as % of GDP (line chart)
    ax2 = ax1.twinx()
    color2 = CBO_RED
    ax2.set_ylabel('Deficit (% of GDP)', color=color2, fontsize=12)
    ax2.plot(years, deficit_pct, color=color2, linewidth=4, marker='o', markersize=8, label='Deficit (% GDP)')
    ax2.tick_params(axis='y', labelcolor=color2)
    ax2.set_ylim(0, 18)
    
    # Add horizontal line for pre-pandemic average
    ax2.axhline(y=4.2, color='gray', linestyle='--', alpha=0.7, linewidth=2)
    ax2.text(2002, 4.8, 'Pre-pandemic avg (4.2%)', fontsize=10, color='gray')
    
    # Title
    plt.title('Federal Deficit over Time', fontsize=18, fontweight='bold', pad=20)
    
    # Combined legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right')
    
    # Key annotations
    ax1.annotate('COVID-19\n$3.2T', xy=(2020, 3200), xytext=(2017, 3500),
                arrowprops=dict(arrowstyle='->', color='black'),
                fontsize=11, ha='center', fontweight='bold')
    
    ax1.annotate('FY2024\n$1.6T (5.6%)', xy=(2024, 1600), xytext=(2024, 2200),
                arrowprops=dict(arrowstyle='->', color=CBO_BLUE),
                fontsize=11, ha='center', color=CBO_BLUE, fontweight='bold')
    
    ax2.annotate('CBO Projection', xy=(2030, 6.0), xytext=(2027, 8),
                arrowprops=dict(arrowstyle='->', color=CBO_RED),
                fontsize=10, ha='center', color=CBO_RED)
    
    ax1.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide26_deficit.png', dpi=100)
    plt.close()
    print("Created: slide26_deficit.png")

# ===== SLIDE 27: Federal Outlays vs Revenue Chart =====
def create_slide27():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    years = [2000, 2005, 2010, 2015, 2020, 2024]
    outlays_pct = [18.0, 19.5, 24.0, 20.5, 31.0, 24.0]
    revenue_pct = [20.0, 17.5, 15.0, 18.0, 16.0, 17.0]
    
    x = np.arange(len(years))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, outlays_pct, width, label='Outlays', color=CBO_BLUE)
    bars2 = ax.bar(x + width/2, revenue_pct, width, label='Revenue', color=CBO_RED)
    
    ax.set_xlabel('Fiscal Year', fontsize=12)
    ax.set_ylabel('% of GDP', fontsize=12)
    ax.set_title('Federal Outlays and Revenues', fontsize=18, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(years)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)
    
    for bar in bars1:
        height = bar.get_height()
        ax.annotate(f'{height}%', xy=(bar.get_x() + bar.get_width()/2, height),
                    xytext=(0, 3), textcoords="offset points", ha='center', fontsize=9)
    for bar in bars2:
        height = bar.get_height()
        ax.annotate(f'{height}%', xy=(bar.get_x() + bar.get_width()/2, height),
                    xytext=(0, 3), textcoords="offset points", ha='center', fontsize=9)
    
    gap = 24.0 - 17.0
    ax.annotate(f'Deficit: {gap}%', xy=(5, 20.5), fontsize=11, color='red', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide27_outlays_revenue.png', dpi=100)
    plt.close()
    print("Created: slide27_outlays_revenue.png")

# ===== SLIDE 28: Spending Categories Pie Chart =====
def create_slide28():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    labels_outlays = ['Social Security', 'Medicare/Medicaid', 'Defense', 'Interest', 'Other Mandatory', 'Discretionary']
    sizes_outlays = [21, 19, 13, 14, 10, 12]
    colors = [CBO_BLUE, '#4682B4', CBO_RED, COLORS['gold'], COLORS['gray'], COLORS['light_gray']]
    explode = (0.02, 0.02, 0.02, 0.08, 0.02, 0.02)
    
    ax1.pie(sizes_outlays, explode=explode, labels=labels_outlays, colors=colors,
            autopct='%1.0f%%', shadow=False, startangle=90, pctdistance=0.75)
    ax1.set_title('Federal Outlays (FY2024)\n$6.8 Trillion', fontsize=14, fontweight='bold')
    
    labels_revenue = ['Individual Income', 'Payroll Taxes', 'Corporate', 'Other']
    sizes_revenue = [49, 33, 9, 9]
    colors2 = [CBO_BLUE, '#6B8E23', CBO_RED, COLORS['gray']]
    
    ax2.pie(sizes_revenue, labels=labels_revenue, colors=colors2,
            autopct='%1.0f%%', shadow=False, startangle=90, pctdistance=0.75)
    ax2.set_title('Federal Revenue (FY2024)\n$4.9 Trillion', fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide28_spending_pie.png', dpi=100)
    plt.close()
    print("Created: slide28_spending_pie.png")

# ===== SLIDE 29: Net Interest vs Defense =====
def create_slide29():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    years = [1990, 2000, 2010, 2015, 2020, 2022, 2024]
    interest = [3.2, 2.3, 1.5, 1.3, 1.3, 1.9, 3.5]
    defense = [5.2, 3.0, 4.8, 3.3, 3.7, 3.2, 3.2]
    
    ax.plot(years, interest, 'o-', color=CBO_RED, linewidth=3, markersize=10, label='Net Interest')
    ax.plot(years, defense, 's-', color=CBO_BLUE, linewidth=3, markersize=10, label='Defense')
    
    ax.set_xlabel('Fiscal Year', fontsize=12)
    ax.set_ylabel('% of GDP', fontsize=12)
    ax.set_title('Net Interest vs Defense Spending', fontsize=18, fontweight='bold', pad=20)
    ax.legend(loc='upper right', fontsize=12)
    ax.grid(alpha=0.3)
    ax.set_xlim(1988, 2026)
    ax.set_ylim(0, 6)
    
    ax.annotate('Interest > Defense\n(Historic First)', xy=(2024, 3.5), xytext=(2021, 4.5),
                arrowprops=dict(arrowstyle='->', color=CBO_RED, lw=2),
                fontsize=12, fontweight='bold', color=CBO_RED)
    
    for y, i, d in zip(years, interest, defense):
        ax.annotate(f'{i}%', (y, i), textcoords="offset points", xytext=(0,10), ha='center', fontsize=9, color=CBO_RED)
        ax.annotate(f'{d}%', (y, d), textcoords="offset points", xytext=(0,-15), ha='center', fontsize=9, color=CBO_BLUE)
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide29_interest_vs_defense.png', dpi=100)
    plt.close()
    print("Created: slide29_interest_vs_defense.png")

# ===== SLIDE 30: National Debt Over Time =====
def create_slide30():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    years = [1980, 1990, 2000, 2007, 2010, 2015, 2020, 2022, 2024, 2025, 2030, 2034, 2054]
    debt_trillions = [0.9, 3.2, 5.6, 8.9, 13.5, 18.0, 27.0, 33.0, 34.4, 38.0, 45.0, 52.0, 100.0]
    
    hist_years = years[:9]
    hist_debt = debt_trillions[:9]
    proj_years = years[8:]
    proj_debt = debt_trillions[8:]
    
    ax.fill_between(hist_years, hist_debt, alpha=0.3, color=CBO_BLUE)
    ax.plot(hist_years, hist_debt, 'o-', color=CBO_BLUE, linewidth=3, markersize=8, label='Historical')
    ax.fill_between(proj_years, proj_debt, alpha=0.3, color=CBO_RED)
    ax.plot(proj_years, proj_debt, 's--', color=CBO_RED, linewidth=3, markersize=8, label='CBO Projection')
    
    ax.set_xlabel('Fiscal Year', fontsize=12)
    ax.set_ylabel('Total National Debt (Trillions $)', fontsize=12)
    ax.set_title('U.S. National Debt Over Time', fontsize=18, fontweight='bold', pad=20)
    ax.legend(loc='upper left', fontsize=12)
    ax.grid(alpha=0.3)
    ax.set_xlim(1978, 2056)
    ax.set_ylim(0, 110)
    
    ax.annotate('$38 Trillion\n(Oct 2025)', xy=(2025, 38), xytext=(2020, 50),
                arrowprops=dict(arrowstyle='->', color=CBO_BLUE),
                fontsize=11, fontweight='bold')
    ax.annotate('$52 Trillion\n(2034)', xy=(2034, 52), xytext=(2038, 65),
                arrowprops=dict(arrowstyle='->', color=CBO_RED),
                fontsize=11, color=CBO_RED)
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide30_debt_timeline.png', dpi=100)
    plt.close()
    print("Created: slide30_debt_timeline.png")

# ===== SLIDE 31: Debt-to-GDP Ratio =====
def create_slide31():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    years = [1980, 1990, 2000, 2007, 2010, 2015, 2020, 2024, 2030, 2034, 2040, 2054]
    debt_gdp = [26, 49, 34, 36, 67, 73, 100, 99, 107, 116, 140, 172]
    
    hist_years = years[:8]
    hist_gdp = debt_gdp[:8]
    proj_years = years[7:]
    proj_gdp = debt_gdp[7:]
    
    ax.bar(hist_years, hist_gdp, color=CBO_BLUE, alpha=0.8, label='Historical', width=1.5)
    ax.bar(proj_years, proj_gdp, color=CBO_RED, alpha=0.6, label='CBO Projection', width=1.5)
    
    ax.axhline(y=100, color='orange', linestyle='--', linewidth=2, label='100% GDP (2020 Peak)')
    ax.axhline(y=172, color='red', linestyle=':', linewidth=2, alpha=0.7)
    
    ax.set_xlabel('Fiscal Year', fontsize=12)
    ax.set_ylabel('Debt Held by Public (% of GDP)', fontsize=12)
    ax.set_title('U.S. Federal Debt-to-GDP Ratio', fontsize=18, fontweight='bold', pad=20)
    ax.legend(loc='upper left', fontsize=11)
    ax.grid(axis='y', alpha=0.3)
    ax.set_xlim(1976, 2058)
    ax.set_ylim(0, 185)
    
    ax.annotate('2024: 99%', xy=(2024, 99), xytext=(2024, 110),
                arrowprops=dict(arrowstyle='->', color=CBO_BLUE),
                fontsize=10, fontweight='bold')
    ax.annotate('2034: 116%', xy=(2034, 116), xytext=(2030, 130),
                arrowprops=dict(arrowstyle='->', color=CBO_RED),
                fontsize=10, color=CBO_RED)
    ax.annotate('2054: 172%', xy=(2054, 172), xytext=(2045, 160),
                arrowprops=dict(arrowstyle='->', color='red'),
                fontsize=10, color='red', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide31_debt_gdp.png', dpi=100)
    plt.close()
    print("Created: slide31_debt_gdp.png")

# ===== SLIDE 32: Who Owns US Debt =====
def create_slide32():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    categories = ['US Gov\'t\nTrust Funds', 'Federal\nReserve', 'Foreign\nGovernments', 'US\nInvestors', 'Other\nInvestors']
    amounts = [7.5, 5.5, 7.0, 6.0, 3.0]
    total = sum(amounts)
    percentages = [a/total*100 for a in amounts]
    
    colors = [CBO_BLUE, '#4682B4', CBO_RED, COLORS['gold'], COLORS['gray']]
    
    bars = ax.barh(categories, amounts, color=colors, height=0.6)
    
    ax.set_xlabel('Trillions of Dollars', fontsize=12)
    ax.set_title('Who Owns U.S. National Debt?\n(Total: $29 Trillion held by public)', fontsize=18, fontweight='bold', pad=20)
    ax.grid(axis='x', alpha=0.3)
    ax.set_xlim(0, 9)
    
    for bar, pct in zip(bars, percentages):
        width = bar.get_width()
        ax.annotate(f'${width}T ({pct:.0f}%)', xy=(width, bar.get_y() + bar.get_height()/2),
                    xytext=(5, 0), textcoords="offset points", ha='left', va='center', fontsize=11, fontweight='bold')
    
    ax.text(0.5, -0.08, 'Foreign holders: Japan ($1.3T), China ($0.8T), UK ($0.7T) are largest foreign holders',
            transform=ax.transAxes, fontsize=10, style='italic', color='gray')
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide32_debt_ownership.png', dpi=100)
    plt.close()
    print("Created: slide32_debt_ownership.png")

# ===== SLIDE 33: Interest Payment Growth =====
def create_slide33():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patchfacecolor = 'white'
    
    years = [2000, 2005, 2010, 2015, 2020, 2022, 2024, 2026, 2030, 2034]
    interest_billions = [223, 352, 196, 223, 345, 475, 950, 1100, 1400, 1800]
    
    ax.fill_between(years, interest_billions, alpha=0.3, color=CBO_RED)
    ax.plot(years, interest_billions, 'o-', color=CBO_RED, linewidth=3, markersize=10)
    
    ax.set_xlabel('Fiscal Year', fontsize=12)
    ax.set_ylabel('Interest Payments (Billions $)', fontsize=12)
    ax.set_title('Net Interest on the National Debt', fontsize=18, fontweight='bold', pad=20)
    ax.grid(alpha=0.3)
    ax.set_xlim(1998, 2036)
    ax.set_ylim(0, 2000)
    
    ax.annotate('$950B\n(2024)', xy=(2024, 950), xytext=(2020, 1100),
                arrowprops=dict(arrowstyle='->', color=CBO_RED),
                fontsize=11, fontweight='bold', color=CBO_RED)
    ax.annotate('$1.8T\n(2034)', xy=(2034, 1800), xytext=(2030, 1650),
                arrowprops=dict(arrowstyle='->', color='red'),
                fontsize=11, color='red', fontweight='bold')
    ax.annotate('~19% of\nFederal Revenue', xy=(2024, 950), xytext=(2025, 600),
                arrowprops=dict(arrowstyle='->', color=CBO_BLUE),
                fontsize=10, color=CBO_BLUE)
    
    plt.tight_layout()
    plt.savefig('lecture_slides/slide33_interest_growth.png', dpi=100)
    plt.close()
    print("Created: slide33_interest_growth.png")

# Run all functions
if __name__ == "__main__":
    os.makedirs("lecture_slides", exist_ok=True)
    
    create_slide26()
    create_slide27()
    create_slide28()
    create_slide29()
    create_slide30()
    create_slide31()
    create_slide32()
    create_slide33()
    
    print("\n✅ All slides with graphs created successfully!")
