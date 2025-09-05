import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime

# Read the JMeter results
df = pd.read_csv('C:\\Users\\juled\\Desktop\\diplomarbeit\\complete-results.jtl')

# Convert timestamp to datetime
df['timestamp'] = pd.to_datetime(df['timeStamp'], unit='ms')

# Extract load level from label
df['load_level'] = df['label'].str.extract(r'(\d+)RPS')
df['api_endpoint'] = df['label'].str.extract(r'([A-Za-z_]+)_API')

# Convert elapsed time from ms to seconds
df['response_time_sec'] = df['elapsed'] / 1000

# Create summary statistics
summary_stats = df.groupby(['load_level', 'api_endpoint']).agg({
    'response_time_sec': ['count', 'mean', 'std', 'min', 'max', 'median'],
    'success': ['count', 'sum']
}).round(4)

summary_stats.columns = ['_'.join(col).strip() for col in summary_stats.columns.values]
summary_stats['error_rate'] = (summary_stats['success_count'] - summary_stats['success_sum']) / summary_stats['success_count'] * 100

print("=== HEALTHCARE PERFORMANCE TEST RESULTS ===")
print(f"Test Duration: ~17 minutes")
print(f"Total Requests: {len(df)}")
print(f"Success Rate: {(df['success'].sum() / len(df) * 100):.2f}%")
print(f"Overall Error Rate: {((len(df) - df['success'].sum()) / len(df) * 100):.2f}%")
print()

print("=== RESPONSE TIME ANALYSIS BY LOAD LEVEL ===")
load_summary = df.groupby('load_level').agg({
    'response_time_sec': ['count', 'mean', 'std', 'min', 'max', 'median'],
    'success': 'mean'
}).round(4)
load_summary.columns = ['_'.join(col).strip() for col in load_summary.columns.values]
print(load_summary)
print()

print("=== API ENDPOINT PERFORMANCE ===")
api_summary = df.groupby('api_endpoint').agg({
    'response_time_sec': ['count', 'mean', 'std', 'min', 'max', 'median'],
    'success': 'mean'
}).round(4)
api_summary.columns = ['_'.join(col).strip() for col in api_summary.columns.values]
print(api_summary)
print()

# Create visualizations
plt.style.use('default')
fig, axes = plt.subplots(2, 2, figsize=(16, 12))

# 1. Response times by load level
ax1 = axes[0, 0]
load_levels = ['50', '100', '250', '500']
mean_times = []
for level in load_levels:
    if level in df['load_level'].values:
        mean_time = df[df['load_level'] == level]['response_time_sec'].mean()
        mean_times.append(mean_time)
    else:
        mean_times.append(0)

bars1 = ax1.bar(load_levels, mean_times, color=['green', 'yellow', 'orange', 'red'])
ax1.set_title('Average Response Time by Load Level', fontsize=14, fontweight='bold')
ax1.set_xlabel('Requests per Second (RPS)')
ax1.set_ylabel('Average Response Time (seconds)')
ax1.axhline(y=2, color='red', linestyle='--', label='2s Target')
ax1.legend()

# Add value labels on bars
for i, bar in enumerate(bars1):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height + 0.01,
             f'{height:.3f}s', ha='center', va='bottom')

# 2. Response times by API endpoint
ax2 = axes[0, 1]
api_means = df.groupby('api_endpoint')['response_time_sec'].mean()
bars2 = ax2.bar(api_means.index, api_means.values, color=['skyblue', 'lightgreen', 'lightcoral'])
ax2.set_title('Average Response Time by API Endpoint', fontsize=14, fontweight='bold')
ax2.set_xlabel('API Endpoint')
ax2.set_ylabel('Average Response Time (seconds)')
ax2.tick_params(axis='x', rotation=45)

# Add value labels
for i, bar in enumerate(bars2):
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height + 0.001,
             f'{height:.3f}s', ha='center', va='bottom')

# 3. Response time distribution
ax3 = axes[1, 0]
df.boxplot(column='response_time_sec', by='load_level', ax=ax3)
ax3.set_title('Response Time Distribution by Load Level', fontsize=14, fontweight='bold')
ax3.set_xlabel('Load Level (RPS)')
ax3.set_ylabel('Response Time (seconds)')
plt.suptitle('')  # Remove automatic title

# 4. Timeline of response times
ax4 = axes[1, 1]
# Sample every 100th point for readability
sample_df = df.iloc[::100].copy()
scatter = ax4.scatter(sample_df['timestamp'], sample_df['response_time_sec'], 
                     c=sample_df['load_level'].astype(float), cmap='viridis', alpha=0.6)
ax4.set_title('Response Times Over Time', fontsize=14, fontweight='bold')
ax4.set_xlabel('Time')
ax4.set_ylabel('Response Time (seconds)')
ax4.tick_params(axis='x', rotation=45)
plt.colorbar(scatter, ax=ax4, label='Load Level (RPS)')

plt.tight_layout()
plt.savefig('C:\\Users\\juled\\Desktop\\diplomarbeit\\performance-analysis.png', dpi=300, bbox_inches='tight')
plt.show()

# Performance interpretation
print("=== PERFORMANCE INTERPRETATION ===")
overall_mean = df['response_time_sec'].mean()
print(f"Overall average response time: {overall_mean:.3f} seconds")

if overall_mean < 2:
    print("✅ EXCELLENT: Average response time is under 2 seconds target")
else:
    print("❌ NEEDS IMPROVEMENT: Average response time exceeds 2 seconds target")

# Check by load level
for level in ['50', '100', '250', '500']:
    if level in df['load_level'].values:
        level_mean = df[df['load_level'] == level]['response_time_sec'].mean()
        print(f"Load {level} RPS: {level_mean:.3f}s", end="")
        if level_mean < 2:
            print(" ✅")
        else:
            print(" ❌")

print()
print("=== BOTTLENECK ANALYSIS ===")
# Find slowest endpoint
slowest_api = df.groupby('api_endpoint')['response_time_sec'].mean().idxmax()
slowest_time = df.groupby('api_endpoint')['response_time_sec'].mean().max()
print(f"Slowest API endpoint: {slowest_api} ({slowest_time:.3f}s average)")

# Find load breaking point
load_breaking_point = None
for level in ['50', '100', '250', '500']:
    if level in df['load_level'].values:
        level_mean = df[df['load_level'] == level]['response_time_sec'].mean()
        if level_mean > 2:
            load_breaking_point = level
            break

if load_breaking_point:
    print(f"Performance degrades at {load_breaking_point} RPS")
else:
    print("System handles all tested load levels well (under 2s)")
