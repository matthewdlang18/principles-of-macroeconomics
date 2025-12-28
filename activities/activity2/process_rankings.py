import pandas as pd
import numpy as np

# Read the Excel file
excel_file = 'data/Class Alternative GDP Index.xlsx'

# Get all sheets from the Excel file
xl = pd.ExcelFile(excel_file)
sheets = xl.sheet_names

# Initialize a dictionary to store all country scores
country_scores = {}

# Process each sheet
for sheet in sheets:
    df = pd.read_excel(excel_file, sheet_name=sheet)
    
    # Extract country and index score columns
    # Assuming the structure is similar to the CSV with 'Country' and 'Index Score' columns
    for idx, row in df.iterrows():
        if pd.notna(row['Country']) and pd.notna(row['Index Score']):
            country = row['Country']
            score = float(row['Index Score'])
            
            if country not in country_scores:
                country_scores[country] = []
            country_scores[country].append(score)

# Calculate average scores and create final dataframe
final_data = []
for country, scores in country_scores.items():
    avg_score = np.mean(scores)
    final_data.append({
        'Country': country,
        'Average Index Score': round(avg_score, 3),
        'Number of Rankings': len(scores)
    })

# Create DataFrame and sort by average score
final_df = pd.DataFrame(final_data)
final_df = final_df.sort_values('Average Index Score', ascending=False)
final_df['Rank'] = range(1, len(final_df) + 1)

# Reorder columns
final_df = final_df[['Rank', 'Country', 'Average Index Score', 'Number of Rankings']]

# Save to CSV
output_file = 'data/average_rankings.csv'
final_df.to_csv(output_file, index=False)
print(f"\nResults saved to {output_file}")
print("\nTop 10 Countries by Average Index Score:")
print(final_df.head(10).to_string(index=False))
