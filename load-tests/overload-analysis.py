import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import re

class OverloadAnalyzer:
    def __init__(self):
        self.sla_latency_ms = 2000  # p95 < 2000ms
        self.sla_error_rate = 1.0   # Error rate < 1%
        
    def analyze_results(self, results_file='results.jtl'):
        """Analyze JTL results and generate required outputs"""
        print("📊 Analyzing mixed scenario step load test...")
        
        # Load data
        df = pd.read_csv(results_file)
        
        # Determine success column
        if 'success' not in df.columns:
            df['success'] = df['responseCode'].astype(str) == '200'
        
        # Extract step from sample names
        df['step'] = df['label'].str.extract(r'Step(\d+)', expand=False).fillna('0').astype(int)
        
        # Define step RPS mapping
        step_rps_mapping = {1: 10, 2: 25, 3: 50, 4: 100, 5: 150, 6: 200, 7: 300}
        df['target_rps'] = df['step'].map(step_rps_mapping)
        
        # Calculate metrics per step
        step_metrics = []
        overload_threshold = None
        overload_reason = None
        
        for step_num in sorted(df['step'].unique()):
            if step_num == 0:  # Skip unknown steps
                continue
                
            step_data = df[df['step'] == step_num]
            if len(step_data) < 10:  # Skip if insufficient data
                continue
            
            target_rps = step_rps_mapping[step_num]
            
            # Calculate actual RPS (requests in steady state - skip first 2 min warmup)
            step_duration = 300  # 5 min steady state
            actual_rps = len(step_data) / (step_duration / 60)  # Convert to per minute, then per second
            
            # Latency percentiles
            p95_latency = np.percentile(step_data['elapsed'], 95)
            
            # Error rate
            error_rate = (1 - step_data['success'].mean()) * 100
            
            # SLA evaluation
            latency_sla_pass = p95_latency < self.sla_latency_ms
            error_sla_pass = error_rate < self.sla_error_rate
            overall_sla_pass = latency_sla_pass and error_sla_pass
            
            # Check for overload threshold
            if overload_threshold is None and not overall_sla_pass:
                overload_threshold = target_rps
                if not latency_sla_pass:
                    overload_reason = f"latency at {target_rps} RPS"
                elif not error_sla_pass:
                    overload_reason = f"errors at {target_rps} RPS"
            
            step_metrics.append({
                'Step': step_num,
                'RPS': target_rps,
                'p95_ms': p95_latency,
                'Error_%': error_rate,
                'SLA_Pass': 'PASS' if overall_sla_pass else 'FAIL'
            })
        
        results_df = pd.DataFrame(step_metrics)
        
        # Generate outputs
        self.generate_table(results_df)
        self.generate_plot(results_df, overload_threshold)
        self.generate_summary_line(overload_threshold, overload_reason)
        
        return results_df, overload_threshold, overload_reason
    
    def generate_table(self, results_df):
        """Generate the required table"""
        print("\n📋 STEP LOAD TEST RESULTS")
        print("=" * 50)
        print(f"{'Step':<6} {'RPS':<6} {'p95(ms)':<10} {'Error %':<10} {'SLA':<8}")
        print("-" * 50)
        
        for _, row in results_df.iterrows():
            print(f"{row['Step']:<6} {row['RPS']:<6} {row['p95_ms']:<10.0f} {row['Error_%']:<10.1f} {row['SLA_Pass']:<8}")
        
        # Save table to file with UTF-8 encoding
        table_file = 'overload-results-table.txt'
        with open(table_file, 'w', encoding='utf-8') as f:
            f.write("HEALTHCARE APPLICATION - OVERLOAD THRESHOLD ANALYSIS\n")
            f.write("=" * 55 + "\n\n")
            f.write(f"SLA: p95 < {self.sla_latency_ms}ms AND Error Rate < {self.sla_error_rate}%\n\n")
            f.write(f"{'Step':<6} {'RPS':<6} {'p95(ms)':<10} {'Error %':<10} {'SLA':<8}\n")
            f.write("-" * 50 + "\n")
            
            for _, row in results_df.iterrows():
                f.write(f"{row['Step']:<6} {row['RPS']:<6} {row['p95_ms']:<10.0f} {row['Error_%']:<10.1f} {row['SLA_Pass']:<8}\n")
        
        print(f"\n💾 Table saved: {table_file}")
    
    def generate_plot(self, results_df, overload_threshold):
        """Generate p95 vs RPS plot with overload threshold"""
        plt.figure(figsize=(12, 8))
        
        # Plot p95 latency
        colors = ['green' if sla == 'PASS' else 'red' for sla in results_df['SLA_Pass']]
        plt.scatter(results_df['RPS'], results_df['p95_ms'], c=colors, s=100, alpha=0.8, edgecolors='black', linewidth=2)
        plt.plot(results_df['RPS'], results_df['p95_ms'], 'b-', alpha=0.5, linewidth=2)
        
        # Mark SLA threshold
        plt.axhline(y=self.sla_latency_ms, color='red', linestyle='--', linewidth=2, alpha=0.8, label=f'SLA Limit ({self.sla_latency_ms}ms)')
        
        # Mark overload threshold
        if overload_threshold:
            plt.axvline(x=overload_threshold, color='red', linestyle=':', linewidth=3, alpha=0.9, label=f'Overload Threshold ({overload_threshold} RPS)')
        
        plt.xlabel('Target RPS', fontsize=14, fontweight='bold')
        plt.ylabel('p95 Latency (ms)', fontsize=14, fontweight='bold')
        plt.title('Healthcare Application - Overload Threshold Analysis\np95 Latency vs RPS', fontsize=16, fontweight='bold')
        plt.grid(True, alpha=0.3)
        plt.legend(fontsize=12)
        
        # Add annotations for SLA pass/fail
        for _, row in results_df.iterrows():
            color = 'green' if row['SLA_Pass'] == 'PASS' else 'red'
            plt.annotate(row['SLA_Pass'], 
                        (row['RPS'], row['p95_ms']), 
                        xytext=(5, 5), textcoords='offset points',
                        fontsize=10, fontweight='bold', color=color)
        
        plt.tight_layout()
        
        # Save plot
        plot_file = 'overload-threshold-plot.png'
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        print(f"💾 Plot saved: {plot_file}")
        
        plt.show()
    
    def generate_summary_line(self, overload_threshold, overload_reason):
        """Generate the required summary line"""
        if overload_threshold:
            summary = f"Overload threshold ≈ {overload_threshold} RPS (first broken SLA: {overload_reason})."
        else:
            summary = "No overload threshold reached - all steps passed SLA requirements."
        
        print(f"\n🎯 SUMMARY:")
        print(summary)
        
        # Save summary with UTF-8 encoding to handle special characters
        summary_file = 'overload-summary.txt'
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("HEALTHCARE APPLICATION - OVERLOAD THRESHOLD SUMMARY\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Test Configuration:\n")
            f.write(f"• Mixed Scenario: 70% GET /dashboard, 30% POST /api/health-metrics\n")
            f.write(f"• Authentication: JWT reused per virtual user\n")
            f.write(f"• Step Load: 10 -> 25 -> 50 -> 100 -> 150 -> 200 -> 300 RPS\n")  # Fixed: Using -> instead of →
            f.write(f"• Step Duration: 2 min warmup + 5 min steady\n")
            f.write(f"• SLA: p95 < {self.sla_latency_ms}ms AND Error Rate < {self.sla_error_rate}%\n\n")
            f.write(f"Result:\n{summary}\n")
        
        print(f"💾 Summary saved: {summary_file}")
        
        return summary

def main():
    """Main execution"""
    print("🏥 HEALTHCARE APPLICATION - OVERLOAD THRESHOLD ANALYSIS")
    print("=" * 60)
    
    # Check for results file
    results_file = 'results.jtl'
    import os
    if not os.path.exists(results_file):
        print(f"❌ Results file '{results_file}' not found!")
        print("Please run the mixed scenario test first:")
        print("   jmeter -n -t mixed-scenario-test.jmx -l results.jtl")
        return
    
    # Run analysis
    analyzer = OverloadAnalyzer()
    results_df, overload_threshold, overload_reason = analyzer.analyze_results(results_file)
    
    print("\n✅ Analysis completed! Generated:")
    print("   📋 Overload results table")
    print("   📊 p95 vs RPS plot with threshold marked")
    print("   🎯 One-line summary")

if __name__ == "__main__":
    main()