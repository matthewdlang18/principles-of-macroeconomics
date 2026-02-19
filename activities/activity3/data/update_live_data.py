#!/usr/bin/env python3
"""
update_live_data.py
-------------------
Generates live_data.json for Activity 3, Step 5 ("Apply to Today").

Run this script whenever you want to refresh the data shown in the activity.
It reads from the existing CSVs in this folder — no FRED API key needed.

To update the source CSVs with newer data:
  1. Download fresh data from FRED (https://fred.stlouisfed.org/) or your
     usual data source and replace/append to LeadingIndicators.csv and
     LeadingIndicators_ZScore.csv.
  2. Run: python3 update_live_data.py
  3. Commit and push the updated live_data.json.

Output: live_data.json — read by recession-detective.html Step 5.
"""

import pandas as pd
import json
import numpy as np
from datetime import datetime

print("Loading CSVs...")

# ── Raw indicators (for CPI, GDP, UE, Fed Funds if present) ─────────────────
df_raw = pd.read_csv('LeadingIndicators.csv')
df_raw['time'] = pd.to_datetime(df_raw['time'], infer_datetime_format=True)
df_raw = df_raw.sort_values('time').reset_index(drop=True)

# ── Z-score indicators (pre-computed, 1985-2019 baseline) ────────────────────
df_z = pd.read_csv('LeadingIndicators_ZScore.csv')
df_z['time'] = pd.to_datetime(df_z['time'], infer_datetime_format=True)
df_z = df_z.sort_values('time').reset_index(drop=True)

# ── Filter to last 65 months (~5.5 years) for charting ──────────────────────
cutoff = df_raw['time'].max() - pd.DateOffset(months=65)
df_raw_recent = df_raw[df_raw['time'] >= cutoff].copy()
df_z_recent   = df_z[df_z['time'] >= cutoff].copy()

def safe_val(series):
    """Return latest non-null value or None."""
    valid = series.dropna()
    return float(valid.iloc[-1]) if len(valid) > 0 else None

def safe_prev(series, n):
    """Return value n non-null periods back from latest, or None."""
    valid = series.dropna()
    idx = len(valid) - 1 - n
    return float(valid.iloc[idx]) if 0 <= idx < len(valid) else None

def to_series(df, col, n_months=65):
    """Return {dates: [...], values: [...]} trimmed to last n_months, nulls as None."""
    sub = df[['time', col]].dropna()
    sub = sub.tail(n_months)
    return {
        'dates':  sub['time'].dt.strftime('%Y-%m-%d').tolist(),
        'values': [round(float(v), 4) if not np.isnan(v) else None for v in sub[col]]
    }

# ── Snapshot values ──────────────────────────────────────────────────────────
unemp_now  = safe_val(df_raw_recent['Unemployment Rate'])
unemp_1yr  = safe_prev(df_raw_recent['Unemployment Rate'], 12)

gdp_yoy    = safe_val(df_raw_recent['US_GDP_YOY'])

# CPI YoY — not in raw CSV; compute from SP500 placeholder or leave None
# If you add a CPI column to LeadingIndicators.csv this will auto-pick it up
cpi_yoy    = safe_val(df_raw_recent['CPI_YOY']) if 'CPI_YOY' in df_raw_recent.columns else None

# Yield spread
yield_now  = safe_val(df_raw_recent['10Y2Y_Yield'])

# Fed Funds — not in raw CSV; include if column is added
fed_funds  = safe_val(df_raw_recent['FEDFUNDS']) if 'FEDFUNDS' in df_raw_recent.columns else None

# Building permits raw (thousands for display)
permits_raw = safe_val(df_raw_recent['Building Permits'])
permits_1yr = safe_prev(df_raw_recent['Building Permits'], 12)
permits_yoy = round((permits_raw - permits_1yr) / permits_1yr * 100, 1) if (permits_raw and permits_1yr) else None

# Initial claims (4-week MA) — weekly series, use 52 non-null steps back
claims_now = safe_val(df_raw_recent['4-Week MA Initial Unemployment Claims'])
claims_1yr = safe_prev(df_raw_recent['4-Week MA Initial Unemployment Claims'], 12)  # monthly data, 12 = 1yr

# SP500
sp500_now  = safe_val(df_raw_recent['SP500'])
sp500_1yr  = safe_prev(df_raw_recent['SP500'], 12)
sp500_yoy  = round((sp500_now - sp500_1yr) / sp500_1yr * 100, 1) if (sp500_now and sp500_1yr) else None

# ISM, PMI, Consumer Confidence, CLI (raw)
ism_now    = safe_val(df_raw_recent['ISM New Orders'])
pmi_now    = safe_val(df_raw_recent['PMI'])
conf_now   = safe_val(df_raw_recent['Consumer Confidence'])
cli_now    = safe_val(df_raw_recent['US CLI'])

# ── Latest Z-scores ──────────────────────────────────────────────────────────
z_latest = {}
z_cols = ['10Y2Y_Yield','US CLI','ISM New Orders','Building Permits',
          'Consumer Confidence','PMI','4-Week MA Initial Unemployment Claims','SP500']
z_id_map = {
    '10Y2Y_Yield':                            '10Y2Y_Yield',
    'US CLI':                                 'US_CLI',
    'ISM New Orders':                         'ISM_New_Orders',
    'Building Permits':                       'Building_Permits',
    'Consumer Confidence':                    'Consumer_Confidence',
    'PMI':                                    'PMI',
    '4-Week MA Initial Unemployment Claims':  'Initial_Claims',
    'SP500':                                  'SP500',
}
for col in z_cols:
    if col in df_z.columns:
        z_latest[z_id_map[col]] = safe_val(df_z[col])

# Latest date across all indicators
latest_date = df_z_recent['time'].max().strftime('%Y-%m')

# ── Time series for charts (last 65 months) ──────────────────────────────────
series = {}

# Raw series
series['unemployment']      = to_series(df_raw, 'Unemployment Rate')
series['gdp_yoy']           = to_series(df_raw, 'US_GDP_YOY')
series['yield_spread']      = to_series(df_raw, '10Y2Y_Yield')
series['building_permits_raw'] = to_series(df_raw, 'Building Permits')
series['sp500']             = to_series(df_raw, 'SP500')
series['ism_new_orders']    = to_series(df_raw, 'ISM New Orders')
series['pmi']               = to_series(df_raw, 'PMI')
series['consumer_confidence'] = to_series(df_raw, 'Consumer Confidence')
series['initial_claims']    = to_series(df_raw, '4-Week MA Initial Unemployment Claims')

# CPI if available
if 'CPI_YOY' in df_raw.columns:
    series['cpi_yoy'] = to_series(df_raw, 'CPI_YOY')

# Z-score series (for index computation)
for col, ind_id in z_id_map.items():
    if col in df_z.columns:
        series[f'z_{ind_id}'] = to_series(df_z, col)

# Building permits YoY% series (computed)
df_raw['permits_yoy'] = df_raw['Building Permits'].pct_change(periods=12) * 100
series['building_permits_yoy'] = to_series(df_raw, 'permits_yoy')

# ── Assemble output ──────────────────────────────────────────────────────────
output = {
    'generated': datetime.now().strftime('%Y-%m-%d %H:%M'),
    'latest_date': latest_date,
    'snapshot': {
        'unemployment':       {'value': unemp_now,   'change_1yr': round(unemp_now - unemp_1yr, 2) if unemp_now and unemp_1yr else None},
        'gdp_yoy':            {'value': gdp_yoy},
        'cpi_yoy':            {'value': cpi_yoy},
        'fed_funds':          {'value': fed_funds},
        'yield_spread':       {'value': round(yield_now, 3) if yield_now else None},
        'building_permits_yoy': {'value': permits_yoy},
        'initial_claims':     {'value': claims_now,  'change_1yr': round(claims_now - claims_1yr, 0) if (claims_now and claims_1yr) else None},
        'sp500_yoy':          {'value': sp500_yoy},
        'ism_new_orders':     {'value': ism_now},
        'pmi':                {'value': pmi_now},
        'consumer_confidence':{'value': conf_now},
        'cli':                {'value': cli_now},
    },
    'z_scores': z_latest,
    'series': series,
}

out_path = 'live_data.json'
with open(out_path, 'w') as f:
    json.dump(output, f, separators=(',', ':'))

# Summary
size_kb = len(json.dumps(output)) / 1024
print(f"\n✅ Written to {out_path} ({size_kb:.0f} KB)")
print(f"   Latest data: {latest_date}")
print(f"   Snapshot values:")
for k, v in output['snapshot'].items():
    print(f"     {k}: {v}")
print(f"   Z-scores: {output['z_scores']}")
print(f"\nCommit live_data.json to deploy the update.")
