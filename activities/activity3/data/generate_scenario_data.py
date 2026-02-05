#!/usr/bin/env python3
"""
Generate anonymized scenario data for Activity 3.
Extracts 24-month windows of:
1. Economic fundamentals (GDP, Unemployment, CPI) - shown first to students
2. Leading indicator Z-scores - used to build their index
Also generates tutorial example data showing before/after recession.
"""

import pandas as pd
import json
from datetime import datetime
from dateutil.relativedelta import relativedelta

# Load the Z-score data (for leading indicators)
df_zscore = pd.read_csv('LeadingIndicators_ZScore.csv')
df_zscore['time'] = pd.to_datetime(df_zscore['time'])

# Load the raw data (for economic fundamentals)
df_raw = pd.read_csv('LeadingIndicators.csv')
df_raw['time'] = pd.to_datetime(df_raw['time'])

# Load scenarios
with open('scenarios.json', 'r') as f:
    scenarios_config = json.load(f)

# Leading indicators (Z-scores) for building the index
leading_indicators = [ind['key'] for ind in scenarios_config['indicators']]

# Economic fundamentals to show students first (raw values, not Z-scores)
fundamentals = ['US_GDP_YOY', 'Unemployment Rate']

scenario_data = {}

# =====================================================
# TUTORIAL EXAMPLE: Great Recession (2007)
# Shows 24 months before T-0 AND 18 months after T-0
# =====================================================
tutorial_t0 = pd.to_datetime('2007-09-01')
tutorial_start = tutorial_t0 - relativedelta(months=23)
tutorial_end = tutorial_t0 + relativedelta(months=18)

# Get extended window for tutorial
mask_z_tut = (df_zscore['time'] >= tutorial_start) & (df_zscore['time'] <= tutorial_end)
window_z_tut = df_zscore[mask_z_tut].copy().sort_values('time')

mask_raw_tut = (df_raw['time'] >= tutorial_start) & (df_raw['time'] <= tutorial_end)
window_raw_tut = df_raw[mask_raw_tut].copy().sort_values('time')

# Create period labels: T-23 to T-0 to T+18
total_periods = len(window_z_tut)
t0_index = 23  # T-0 is at index 23 (24 months in)
window_z_tut['period'] = [f"T{i-t0_index:+d}" if i != t0_index else "T-0" for i in range(total_periods)]
window_raw_tut['period'] = [f"T{i-t0_index:+d}" if i != t0_index else "T-0" for i in range(total_periods)]

tutorial_data = {
    'periods': window_z_tut['period'].tolist(),
    't0_index': t0_index,  # Index where T-0 is located
    'fundamentals': {},
    'indicators': {}
}

# Extract fundamentals for tutorial
for fund in fundamentals:
    if fund in window_raw_tut.columns:
        values = window_raw_tut[fund].tolist()
        values = [None if pd.isna(v) else round(float(v), 1) for v in values]
        tutorial_data['fundamentals'][fund] = values

# Extract indicators for tutorial
for ind in leading_indicators:
    if ind in window_z_tut.columns:
        values = window_z_tut[ind].tolist()
        values = [None if pd.isna(v) else round(float(v), 4) for v in values]
        tutorial_data['indicators'][ind] = values

print(f"Tutorial example: {len(tutorial_data['periods'])} periods (T-23 to T+{total_periods - t0_index - 1})")

for scenario in scenarios_config['scenarios']:
    scenario_id = scenario['id']
    t0_date = pd.to_datetime(scenario['t0_date'])

    # Get 24 months of data ending at T-0
    start_date = t0_date - relativedelta(months=23)

    # Filter Z-score data for leading indicators
    mask_z = (df_zscore['time'] >= start_date) & (df_zscore['time'] <= t0_date)
    window_z = df_zscore[mask_z].copy().sort_values('time')

    # Filter raw data for fundamentals
    mask_raw = (df_raw['time'] >= start_date) & (df_raw['time'] <= t0_date)
    window_raw = df_raw[mask_raw].copy().sort_values('time')

    if len(window_z) < 20:
        print(f"Warning: Scenario {scenario_id} ({scenario['t0_date']}) only has {len(window_z)} months of Z-score data")

    # Create anonymized time labels (T-23, T-22, ..., T-0)
    window_z['period'] = [f"T-{23-i}" for i in range(len(window_z))]
    window_raw['period'] = [f"T-{23-i}" for i in range(len(window_raw))]

    # Initialize scenario data structure
    scenario_data[scenario_id] = {
        'periods': window_z['period'].tolist(),
        'fundamentals': {},  # GDP, Unemployment, etc.
        'indicators': {}     # Z-scores for building index
    }

    # Extract economic fundamentals (raw values)
    for fund in fundamentals:
        if fund in window_raw.columns:
            values = window_raw[fund].tolist()
            # Replace NaN with null for JSON, round to 1 decimal
            values = [None if pd.isna(v) else round(float(v), 1) for v in values]
            scenario_data[scenario_id]['fundamentals'][fund] = values
        else:
            print(f"Warning: Fundamental {fund} not found in raw data")

    # Extract leading indicator Z-scores
    for ind in leading_indicators:
        if ind in window_z.columns:
            values = window_z[ind].tolist()
            # Replace NaN with null for JSON
            values = [None if pd.isna(v) else round(float(v), 4) for v in values]
            scenario_data[scenario_id]['indicators'][ind] = values
        else:
            print(f"Warning: Indicator {ind} not found in Z-score data")

# Define the fundamentals metadata
fundamentals_meta = [
    {"key": "US_GDP_YOY", "name": "GDP Growth (YoY)", "description": "Year-over-year GDP growth rate", "unit": "%"},
    {"key": "Unemployment Rate", "name": "Unemployment Rate", "description": "Civilian unemployment rate", "unit": "%"}
]

# Save the scenario data
output = {
    'scenarios': scenarios_config['scenarios'],
    'fundamentals': fundamentals_meta,
    'indicators': scenarios_config['indicators'],
    'scenario_data': scenario_data,
    'tutorial_example': tutorial_data  # Before/after data for tutorial
}

with open('scenario_data.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Generated data for {len(scenario_data)} scenarios")
for sid, data in scenario_data.items():
    periods = len(data['periods'])
    gdp_vals = [v for v in data['fundamentals'].get('US_GDP_YOY', []) if v is not None]
    unemp_vals = [v for v in data['fundamentals'].get('Unemployment Rate', []) if v is not None]
    print(f"  Scenario {sid}: {periods} periods, GDP: {len(gdp_vals)} vals, Unemp: {len(unemp_vals)} vals")
