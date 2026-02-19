#!/usr/bin/env python3
"""
fetch_new_data.py
-----------------
Fetches the latest values for Activity 3 indicators from FRED and the OECD,
appends new monthly rows to LeadingIndicators.csv and LeadingIndicators_ZScore.csv,
then regenerates live_data.json.

Run every few months to keep the data current:

    python3 fetch_new_data.py

Requires: pandas, requests, numpy
Install:  pip install pandas requests numpy

─────────────────────────────────────────────────────────────────────────────
Automated sources (no action needed):
  • Yield curve (10Y-2Y)     FRED: DGS10, DGS2
  • Building Permits          FRED: PERMIT
  • Initial Claims (4wk MA)  FRED: IC4WSA
  • S&P 500                  FRED: SP500
  • Unemployment Rate        FRED: UNRATE
  • Consumer Sentiment       FRED: UMCSENT
  • CPI YoY %                FRED: CPIAUCSL
  • Fed Funds Rate           FRED: FEDFUNDS
  • US CLI                   FRED: USALOLITOAASTSAM
  • Durable Goods Orders YoY FRED: DGORDER
  • Transport Equipment YoY  FRED: A36SNO

Manual entry still required (proprietary, not on any free API):
  • ISM New Orders & PMI → https://www.ismworld.org/
      After running this script, it will print a table showing which
      months are missing. Copy the values from the ISM website and
      re-run:  python3 update_live_data.py
─────────────────────────────────────────────────────────────────────────────
"""

import requests
import pandas as pd
import numpy as np
import subprocess
import sys
from datetime import datetime

# ── FRED API key ──────────────────────────────────────────────────────────────
FRED_API_KEY = 'c1a69cc8450457303e5f04ffb3f68b97'
FRED_BASE    = 'https://api.stlouisfed.org/fred/series/observations'

# ── Baseline stats (1985–2019) used to compute z-scores ──────────────────────
# These match the pre-computed baseline in LeadingIndicators_ZScore.csv.
# Do NOT change — they define "historical normal" for this activity.
BASELINE = {
    '10Y2Y_Yield':     {'mean': 1.1025,    'std': 0.8513,      'invert': False},
    'Building_Permits':{'mean': 1352947.619,'std': 399002.219,  'invert': False},
    'Consumer_Conf':   {'mean': 88.3333,   'std': 11.6132,     'invert': False},
    'Initial_Claims':  {'mean': 349497.024, 'std': 73416.939,   'invert': True},   # high = bad
    'SP500_YOY':       {'mean': 9.9019,    'std': 15.6395,     'invert': False},   # YoY% basis
    'ISM_New_Orders':  {'mean': 55.1819,   'std': 6.4291,      'invert': False},
    'PMI':             {'mean': 52.3262,   'std': 4.7230,      'invert': False},
    # CLI: baseline reverse-engineered from existing CSV z-score pairs
    'US_CLI':          {'mean': 100.003,   'std': 1.330,       'invert': False},
    # Durable Goods and Transport Equipment YoY% (1985–2019 baseline)
    'Durable_Goods':       {'mean': 2.928,    'std': 10.357,   'invert': False},
    'Transport_Equipment': {'mean': 4.455,    'std': 19.349,   'invert': False},
}


def fred_monthly(series_id, units='lin', n_months=120):
    """
    Fetch the most recent n_months of monthly data from FRED.
    Returns a pd.Series indexed by month-start dates, oldest→newest.
    """
    params = {
        'series_id':          series_id,
        'api_key':            FRED_API_KEY,
        'file_type':          'json',
        'sort_order':         'desc',        # newest first so limit gets us the latest
        'limit':              n_months,
        'frequency':          'm',
        'aggregation_method': 'avg',
    }
    if units != 'lin':
        params['units'] = units
    r = requests.get(FRED_BASE, params=params, timeout=20)
    r.raise_for_status()
    rows = []
    for o in r.json().get('observations', []):
        if o['value'] in ('.', ''):
            continue
        dt = pd.to_datetime(o['date']).to_period('M').to_timestamp()
        rows.append({'time': dt, 'value': float(o['value'])})
    if not rows:
        return pd.Series(dtype=float, name=series_id)
    s = pd.DataFrame(rows).drop_duplicates('time').set_index('time')['value'].sort_index()
    s.name = series_id
    return s


def zscore(value, key):
    """Compute z-score using 1985–2019 baseline. Invert if higher = worse."""
    b = BASELINE[key]
    z = (value - b['mean']) / b['std']
    return -z if b['invert'] else z


# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("fetch_new_data.py — Recession Detective data updater")
print(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
print("=" * 60)

# ── Fetch series from FRED ────────────────────────────────────────────────────
print("\nFetching from FRED (most recent 120 months):")

fetched = {}
tasks = [
    ('DGS10',            'lin', '10Y Treasury yield'),
    ('DGS2',             'lin', '2Y Treasury yield'),
    ('PERMIT',           'lin', 'Building Permits (SAAR, thousands)'),
    ('IC4WSA',           'lin', '4-Week MA Initial Claims'),
    ('SP500',            'lin', 'S&P 500'),
    ('UNRATE',           'lin', 'Unemployment Rate'),
    ('UMCSENT',          'lin', 'U Mich Consumer Sentiment'),
    ('CPIAUCSL',         'pc1', 'CPI YoY %'),
    ('FEDFUNDS',         'lin', 'Fed Funds Rate'),
    ('USALOLITOAASTSAM', 'lin', 'US CLI (OECD amplitude-adjusted, via FRED)'),
    ('DGORDER',          'pc1', 'Durable Goods Orders YoY %'),
    ('A36SNO',           'pc1', 'Transportation Equipment Orders YoY %'),
]

for sid, units, label in tasks:
    print(f"  {label}...", end=' ', flush=True)
    try:
        s = fred_monthly(sid, units=units)
        fetched[sid] = s
        latest_date = s.index[-1].strftime('%Y-%m') if len(s) else 'no data'
        print(f"OK — latest: {latest_date} ({len(s)} obs)")
    except Exception as e:
        print(f"FAILED: {e}")
        fetched[sid] = pd.Series(dtype=float, name=sid)

# GDP — quarterly, can't request as monthly from FRED; fetch as quarterly
print("  Real GDP QoQ %...", end=' ', flush=True)
try:
    r = requests.get(FRED_BASE, params={
        'series_id': 'A191RL1Q225SBEA', 'api_key': FRED_API_KEY,
        'file_type': 'json', 'sort_order': 'desc', 'limit': 40,
    }, timeout=20)
    r.raise_for_status()
    gdp_rows = []
    for o in r.json().get('observations', []):
        if o['value'] not in ('.', ''):
            dt = pd.to_datetime(o['date']).to_period('M').to_timestamp()
            gdp_rows.append({'time': dt, 'value': float(o['value'])})
    gdp = pd.DataFrame(gdp_rows).drop_duplicates('time').set_index('time')['value'].sort_index()
    print(f"OK — latest: {gdp.index[-1].strftime('%Y-%m')} ({len(gdp)} obs)")
except Exception as e:
    print(f"FAILED: {e}")
    gdp = pd.Series(dtype=float)

# Derived series
t10 = fetched['DGS10']
t2  = fetched['DGS2']
common_idx = t10.index.intersection(t2.index)
yield_spread = (t10.loc[common_idx] - t2.loc[common_idx]).dropna()
yield_spread.name = 'yield_spread'

# Building permits: PERMIT is in thousands → convert to units
permits_raw = (fetched['PERMIT'] * 1000).dropna()
permits_raw.name = 'Building Permits'

# SP500 YoY% — needed for z-score; compute from level series (need 13 months)
sp500 = fetched['SP500']
sp500_yoy = sp500.pct_change(12) * 100   # YoY % change
sp500_yoy.name = 'SP500_YOY'

# ── Load existing CSVs ────────────────────────────────────────────────────────
print("\nLoading existing CSVs...")
df_raw = pd.read_csv('LeadingIndicators.csv')
df_raw['time'] = pd.to_datetime(df_raw['time'], format='mixed', dayfirst=False)
df_raw = df_raw.sort_values('time').reset_index(drop=True)

df_z = pd.read_csv('LeadingIndicators_ZScore.csv')
df_z['time'] = pd.to_datetime(df_z['time'], format='mixed', dayfirst=False)
df_z = df_z.sort_values('time').reset_index(drop=True)

raw_last = df_raw['time'].max()
z_last   = df_z['time'].max()
print(f"  Raw CSV last date:     {raw_last.strftime('%Y-%m')}")
print(f"  Z-score CSV last date: {z_last.strftime('%Y-%m')}")

# ── Build combined monthly frame for new data ─────────────────────────────────
all_monthly = pd.DataFrame({
    '10Y2Y_Yield':   yield_spread,
    'Building Permits': permits_raw,
    '4-Week MA Initial Unemployment Claims': fetched['IC4WSA'],
    'SP500':         sp500,
    'SP500_YOY':     sp500_yoy,
    'Unemployment Rate': fetched['UNRATE'],
    'Consumer Confidence': fetched['UMCSENT'],
    'CPI_YOY':       fetched['CPIAUCSL'],
    'FEDFUNDS':      fetched['FEDFUNDS'],
    'GDP_QOQ':       gdp,
    'US CLI':        fetched.get('USALOLITOAASTSAM', pd.Series(dtype=float)),
    'Durable_Goods_YOY':       fetched.get('DGORDER',  pd.Series(dtype=float)),
    'Transport_Equipment_YOY': fetched.get('A36SNO',   pd.Series(dtype=float)),
    # ISM New Orders and PMI — proprietary, filled in manually below
}).sort_index()
all_monthly.index.name = 'time'

# ── Append new rows to raw CSV ────────────────────────────────────────────────
new_raw = all_monthly[all_monthly.index > raw_last].copy()
print(f"\n  New raw rows to append: {len(new_raw)}")

if len(new_raw) > 0:
    print(f"  Dates: {new_raw.index.min().strftime('%Y-%m')} → {new_raw.index.max().strftime('%Y-%m')}")
    existing_cols = list(df_raw.columns)
    append_rows = []
    for dt, row in new_raw.iterrows():
        r = {c: np.nan for c in existing_cols}
        r['time'] = dt.strftime('%-m/1/%y')

        def v(col, dec=4):
            val = row.get(col, np.nan)
            return round(float(val), dec) if not pd.isna(val) else np.nan

        r['10Y2Y_Yield']      = v('10Y2Y_Yield', 4)
        r['ISM New Orders']   = np.nan   # proprietary — fill manually (see below)
        r['US_GDP_YOY']       = np.nan
        r['US_GDP_QOQ']       = v('GDP_QOQ', 1)
        r['Building Permits'] = v('Building Permits', 0)
        r['Consumer Confidence'] = v('Consumer Confidence', 1)
        r['PMI']              = np.nan   # proprietary — fill manually (see below)
        r['4-Week MA Initial Unemployment Claims'] = v('4-Week MA Initial Unemployment Claims', 0)
        r['Unemployment Rate'] = v('Unemployment Rate', 1)
        r['US CLI']           = v('US CLI', 5)
        r['SP500']            = v('SP500', 2)
        if 'CPI_YOY' in existing_cols:
            r['CPI_YOY'] = v('CPI_YOY', 2)
        if 'Durable_Goods_YOY' in existing_cols:
            r['Durable_Goods_YOY'] = v('Durable_Goods_YOY', 2)
        if 'Transport_Equipment_YOY' in existing_cols:
            r['Transport_Equipment_YOY'] = v('Transport_Equipment_YOY', 2)
        append_rows.append(r)

    df_raw_new = pd.DataFrame(append_rows, columns=existing_cols)
    df_raw_updated = pd.concat([df_raw, df_raw_new], ignore_index=True)
    df_raw_updated.to_csv('LeadingIndicators.csv', index=False)
    print(f"  ✅ LeadingIndicators.csv: {len(df_raw)} → {len(df_raw_updated)} rows")
else:
    print("  ⏭  LeadingIndicators.csv already up to date.")

# ── Append new rows to z-score CSV ───────────────────────────────────────────
new_z = all_monthly[all_monthly.index > z_last].copy()
print(f"\n  New z-score rows to append: {len(new_z)}")

if len(new_z) > 0:
    z_cols = list(df_z.columns)
    z_append = []
    for dt, row in new_z.iterrows():
        zr = {c: np.nan for c in z_cols}
        zr['time'] = dt.strftime('%-m/1/%y')

        def zv(raw_col, baseline_key):
            val = row.get(raw_col, np.nan)
            return round(zscore(float(val), baseline_key), 9) if not pd.isna(val) else np.nan

        zr['10Y2Y_Yield']    = zv('10Y2Y_Yield',   '10Y2Y_Yield')
        zr['US CLI']         = zv('US CLI',        'US_CLI')
        zr['ISM New Orders'] = np.nan   # proprietary — filled manually after script runs
        zr['Building Permits'] = zv('Building Permits', 'Building_Permits')
        zr['Consumer Confidence'] = zv('Consumer Confidence', 'Consumer_Conf')
        zr['PMI']            = np.nan   # proprietary — filled manually after script runs
        zr['4-Week MA Initial Unemployment Claims'] = zv('4-Week MA Initial Unemployment Claims', 'Initial_Claims')
        zr['SP500']          = zv('SP500_YOY', 'SP500_YOY')   # YoY% basis, not level
        if 'Durable_Goods' in z_cols:
            zr['Durable_Goods']       = zv('Durable_Goods_YOY', 'Durable_Goods')
        if 'Transport_Equipment' in z_cols:
            zr['Transport_Equipment'] = zv('Transport_Equipment_YOY', 'Transport_Equipment')

        z_append.append(zr)

    df_z_new = pd.DataFrame(z_append, columns=z_cols)
    df_z_updated = pd.concat([df_z, df_z_new], ignore_index=True)
    df_z_updated.to_csv('LeadingIndicators_ZScore.csv', index=False)
    print(f"  ✅ LeadingIndicators_ZScore.csv: {len(df_z)} → {len(df_z_updated)} rows")
else:
    print("  ⏭  LeadingIndicators_ZScore.csv already up to date.")

# ── Regenerate live_data.json ─────────────────────────────────────────────────
print("\nRegenerating live_data.json...")
result = subprocess.run([sys.executable, 'update_live_data.py'], capture_output=True, text=True)
print(result.stdout)
if result.returncode != 0:
    print("ERROR from update_live_data.py:")
    print(result.stderr)
    sys.exit(1)

print("=" * 60)
print("✅ Automated sources updated (FRED + OECD via FRED):")
print("   • Yield curve, Building Permits, Initial Claims")
print("   • S&P 500, Unemployment, Consumer Sentiment, CPI, Fed Funds")
print("   • US CLI (OECD amplitude-adjusted)")
print("   • Durable Goods Orders YoY %")
print("   • Transportation Equipment Orders YoY %")
print()

# ── Show missing ISM / PMI values so they're easy to fill in manually ─────────
df_final = pd.read_csv('LeadingIndicators.csv')
df_final['time'] = pd.to_datetime(df_final['time'], format='mixed', dayfirst=False)
missing = df_final[df_final['ISM New Orders'].isna() | df_final['PMI'].isna()].copy()
missing = missing[missing['time'] >= pd.Timestamp('2020-01-01')]

if len(missing) > 0:
    print("⚠️  ISM New Orders and PMI still need manual entry.")
    print("   Source: https://www.ismworld.org/  (Manufacturing Report on Business)")
    print()
    print(f"   {'Month':<10}  {'ISM New Orders':>15}  {'PMI':>8}")
    print(f"   {'-'*10}  {'-'*15}  {'-'*8}")
    for _, row in missing.iterrows():
        ism_val = f"{row['ISM New Orders']:.1f}" if not pd.isna(row['ISM New Orders']) else '  ← needed'
        pmi_val = f"{row['PMI']:.1f}"            if not pd.isna(row['PMI'])            else '← needed'
        print(f"   {row['time'].strftime('%Y-%m'):<10}  {ism_val:>15}  {pmi_val:>8}")
    print()
    print("   Edit LeadingIndicators.csv with those values, then run:")
    print("     python3 update_live_data.py")
    print("   (The z-scores will be computed automatically from the raw values.)")
else:
    print("✅ ISM New Orders and PMI are fully up to date.")

print()
print("To deploy:")
print("  git add activities/activity3/data/")
print("  git commit -m 'Refresh leading indicator data'")
print("  git push")
