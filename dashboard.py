import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.gridspec import GridSpec

# Step 1: Read the data from the text file
def read_data_from_txt(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()
        
    # Remove header and split the remaining lines into lists
    data = [line.strip().split(', ') for line in lines[1:]]
    
    # Create a DataFrame with the relevant columns (converting price to numeric, remove $)
    df = pd.DataFrame(data, columns=['Quantity', 'Company', 'Name', 'Price', 'Processor', 'Graphics Card', 'Battery Life'])
    df['Quantity'] = pd.to_numeric(df['Quantity'])
    df['Price'] = pd.to_numeric(df['Price'].str.replace('$', ''))
    return df

# Step 2: Load the data from the text file
file_path = 'sales.txt'
df = read_data_from_txt(file_path)

# Calculate total sales for each product
df['Total Sales'] = df['Quantity'] * df['Price']

# Step 3: Aggregate sales by company
company_sales = df.groupby('Company')['Total Sales'].sum().reset_index()

df['Price'] = df['Price'].apply(lambda x: f'${x:,.2f}')
df['Total Sales'] = df['Total Sales'].apply(lambda x: f'${x:,.2f}')

# Step 4: Create the dashboard
fig = plt.figure(constrained_layout=True, figsize=(10, 8))
gs = GridSpec(2, 2, figure=fig)  # 2 rows and 2 columns grid

# 1. Table of product sales (only Name, Price, and Total Sales)
ax1 = fig.add_subplot(gs[0, :])  # Span across both columns (full row)
ax1.axis('tight')
ax1.axis('off')
table_data = df[['Name', 'Price', 'Total Sales']]
table = ax1.table(cellText=table_data.values, colLabels=table_data.columns, cellLoc='center', loc='center')
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 1.2)

# Set custom colors for the table headers
for (i, j), cell in table.get_celld().items():
    if i == 0:  # Header row
        cell.set_fontsize(10)
        cell.set_text_props(color="white")  # Text color
        cell.set_facecolor("#4CAF50")  # Background color for the header
    else:
        cell.set_facecolor("#c1f7c3")  # Background color for the cells


# 2. Bar chart of quantities sold
ax2 = fig.add_subplot(gs[1, 0])  # Left column
ax2.bar(df['Name'], df['Quantity'], color='skyblue')
ax2.set_title('Quantity Sold per Product')
ax2.set_ylabel('Quantity Sold')
ax2.set_xticklabels(df['Name'], rotation=90, ha='right', fontsize=8)

# 3. Pie chart for the proportion of total sales by company (with smaller percentages)
ax3 = fig.add_subplot(gs[1, 1])  # Right column
ax3.pie(company_sales['Total Sales'], labels=company_sales['Company'], autopct='%1.1f%%', startangle=140, textprops={'fontsize': 8}, colors=plt.cm.Paired.colors)
ax3.set_title('Proportion of Total Sales by Company')

# Step 5: Save the dashboard as an image
plt.savefig('sales_dashboard_company_pie.png', dpi=300)

# Show the plot (optional)
plt.show()
