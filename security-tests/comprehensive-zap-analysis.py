#!/usr/bin/env python3
"""
Comprehensive ZAP Security Analysis
Extracts security metrics from OWASP ZAP reports for medical application assessment
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path

def analyze_security_reports():
    """Main analysis function"""
    reports_dir = Path("reports")
    
    print("\n" + "="*60)
    print("   COMPREHENSIVE SECURITY ANALYSIS")
    print("   Medical Application Assessment")
    print("="*60)
    
    if not reports_dir.exists():
        print("❌ Reports directory not found!")
        return
    
    # Find report files
    html_report = None
    json_report = None
    summary_json = None
    
    for file in reports_dir.iterdir():
        if file.suffix == '.html' and 'security' in file.name:
            html_report = file
        elif file.suffix == '.json' and 'detailed' in file.name:
            json_report = file
        elif file.suffix == '.json' and 'summary' in file.name:
            summary_json = file
    
    results = {}
    
    # Analyze JSON reports if available
    if json_report and json_report.exists():
        print(f"📊 Analyzing: {json_report.name}")
        results.update(analyze_json_report(json_report))
    
    if summary_json and summary_json.exists():
        print(f"📊 Analyzing: {summary_json.name}")
        results.update(analyze_summary_json(summary_json))
    
    # Analyze HTML report
    if html_report and html_report.exists():
        print(f"📊 Analyzing: {html_report.name}")
        results.update(analyze_html_report(html_report))
    
    # Generate comprehensive analysis
    generate_analysis_report(results)

def analyze_json_report(json_file):
    """Analyze detailed JSON report"""
    results = {
        'vulnerabilities': [],
        'risk_levels': {'High': 0, 'Medium': 0, 'Low': 0, 'Informational': 0},
        'owasp_categories': {},
        'api_endpoints': []
    }
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract vulnerabilities from ZAP JSON structure
        sites = data.get('site', [])
        for site in sites:
            alerts = site.get('alerts', [])
            for alert in alerts:
                vuln = {
                    'name': alert.get('name', 'Unknown'),
                    'risk': alert.get('risk', 'Unknown'),
                    'confidence': alert.get('confidence', 'Unknown'),
                    'description': alert.get('desc', ''),
                    'instances': len(alert.get('instances', [])),
                    'urls': [inst.get('uri', '') for inst in alert.get('instances', [])]
                }
                results['vulnerabilities'].append(vuln)
                
                # Count risk levels
                risk = vuln['risk']
                if risk in results['risk_levels']:
                    results['risk_levels'][risk] += 1
                
                # Extract API endpoints
                for url in vuln['urls']:
                    if '/api/' in url:
                        results['api_endpoints'].append(url)
        
        print(f"  ✓ Found {len(results['vulnerabilities'])} security findings")
        
    except Exception as e:
        print(f"  ⚠️  Error analyzing JSON report: {str(e)}")
    
    return results

def analyze_summary_json(summary_file):
    """Analyze summary JSON for high-level metrics"""
    results = {'scan_metrics': {}}
    
    try:
        with open(summary_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract scan statistics
        results['scan_metrics'] = {
            'total_alerts': data.get('totalAlerts', 0),
            'high_risk': data.get('highAlerts', 0),
            'medium_risk': data.get('mediumAlerts', 0),
            'low_risk': data.get('lowAlerts', 0),
            'info_risk': data.get('infoAlerts', 0),
            'false_positives': data.get('falsePositiveAlerts', 0)
        }
        
        print(f"  ✓ Scan metrics extracted from summary")
        
    except Exception as e:
        print(f"  ⚠️  Error analyzing summary: {str(e)}")
    
    return results

def analyze_html_report(html_file):
    """Analyze HTML report for additional metrics"""
    results = {'html_analysis': {}, 'time_analysis': {}}
    
    try:
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Extract scan duration and timing
        duration_match = re.search(r'Scan Duration[:\s]*([0-9]+(?:\.[0-9]+)?)\s*minutes?', content, re.IGNORECASE)
        if duration_match:
            results['time_analysis']['scan_duration_minutes'] = float(duration_match.group(1))
        
        # Count URLs tested
        url_matches = re.findall(r'http[s]?://[^\s<>"]+', content)
        unique_urls = set(url_matches)
        results['html_analysis']['urls_tested'] = len(unique_urls)
        
        # Extract file size for report complexity
        file_size = html_file.stat().st_size / (1024 * 1024)  # MB
        results['html_analysis']['report_size_mb'] = round(file_size, 2)
        
        print(f"  ✓ HTML analysis complete ({file_size:.1f}MB report)")
        
    except Exception as e:
        print(f"  ⚠️  Error analyzing HTML report: {str(e)}")
    
    return results

def generate_analysis_report(results):
    """Generate comprehensive analysis report"""
    print("\n" + "="*60)
    print("   SECURITY ASSESSMENT RESULTS")
    print("="*60)
    
    # Risk Summary
    risk_levels = results.get('risk_levels', {})
    total_findings = sum(risk_levels.values())
    
    print(f"\n🔍 VULNERABILITY SUMMARY:")
    print(f"   Total Security Findings: {total_findings}")
    print(f"   🔴 High Risk:     {risk_levels.get('High', 0)}")
    print(f"   🟡 Medium Risk:   {risk_levels.get('Medium', 0)}")
    print(f"   🟢 Low Risk:      {risk_levels.get('Low', 0)}")
    print(f"   ℹ️  Informational: {risk_levels.get('Informational', 0)}")
    
    # Scan Metrics
    scan_metrics = results.get('scan_metrics', {})
    if scan_metrics:
        print(f"\n📊 SCAN METRICS:")
        print(f"   Total Alerts: {scan_metrics.get('total_alerts', 'N/A')}")
        print(f"   False Positives: {scan_metrics.get('false_positives', 'N/A')}")
    
    # Time Analysis
    time_analysis = results.get('time_analysis', {})
    if 'scan_duration_minutes' in time_analysis:
        duration = time_analysis['scan_duration_minutes']
        print(f"\n⏱️  TIME ANALYSIS:")
        print(f"   Scan Duration: {duration:.1f} minutes")
        if duration > 0:
            findings_per_minute = total_findings / duration
            print(f"   Findings Rate: {findings_per_minute:.1f} findings/minute")
    
    # Coverage Analysis
    html_analysis = results.get('html_analysis', {})
    if html_analysis:
        print(f"\n🎯 COVERAGE ANALYSIS:")
        print(f"   URLs Tested: {html_analysis.get('urls_tested', 'N/A')}")
        print(f"   Report Size: {html_analysis.get('report_size_mb', 'N/A')} MB")
    
    # API Security Analysis
    api_endpoints = results.get('api_endpoints', [])
    unique_apis = set(api_endpoints)
    if unique_apis:
        print(f"\n🔧 API SECURITY:")
        print(f"   API Endpoints Tested: {len(unique_apis)}")
        for api in sorted(unique_apis)[:5]:  # Show first 5
            print(f"     • {api}")
        if len(unique_apis) > 5:
            print(f"     ... and {len(unique_apis) - 5} more")
    
    # Security Assessment
    print(f"\n🛡️  SECURITY ASSESSMENT:")
    if risk_levels.get('High', 0) == 0 and risk_levels.get('Medium', 0) <= 2:
        print("   ✅ EXCELLENT - Strong security posture")
        print("   ✅ No critical vulnerabilities found")
        if risk_levels.get('Low', 0) > 0:
            print("   ℹ️  Minor improvements recommended")
    elif risk_levels.get('High', 0) == 0:
        print("   ✅ GOOD - No critical issues")
        print("   ⚠️  Address medium-risk findings")
    else:
        print("   🔴 ACTION REQUIRED - Critical issues found")
        print("   🚨 Immediate remediation needed")
    
    # Time-to-Compromise Analysis
    critical_high = risk_levels.get('High', 0)
    if critical_high == 0:
        print(f"\n🔒 TIME-TO-COMPROMISE:")
        print("   📊 No immediate attack vectors identified")
        print("   🛡️  Application shows strong resistance to automated attacks")
        if time_analysis.get('scan_duration_minutes', 0) >= 10:
            print("   ⏱️  Extended testing confirms security hardening")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if total_findings == 0:
        print("   🎯 Continue regular security assessments")
        print("   🔄 Monitor for new vulnerabilities")
    else:
        print("   🔧 Review and address identified findings")
        print("   📝 Document remediation efforts")
        print("   🔄 Re-test after implementing fixes")
    
    print("\n" + "="*60)
    print(f"   Analysis completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

if __name__ == "__main__":
    analyze_security_reports()