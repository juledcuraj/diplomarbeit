import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { MEDICAL_CONFIG } from '@/lib/config';

interface HealthMetric {
  id: number;
  metric_date: string;
  metric_type: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
}

interface AppointmentSuggestion {
  id: string;
  title: string;
  specialty: string;
  danger_level: 1 | 2 | 3;
  timeframe: string;
  proposed_slots: string[];
  reason: string;
  decline_consequence: string;
  no_show_consequence: string;
  related_metrics: string[];
  created_at: string;
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get latest health metrics for the user
    const metricsQuery = `
      SELECT * FROM health_metrics 
      WHERE user_id = $1 
      ORDER BY metric_date DESC, created_at DESC
    `;
    
    const metricsResult = await pool.query(metricsQuery, [user.id]);
    const metrics = metricsResult.rows as HealthMetric[];

    const suggestions = generateAppointmentTips(metrics, user.id);
    
    return NextResponse.json({ 
      success: true, 
      suggestions: suggestions.sort((a: AppointmentSuggestion, b: AppointmentSuggestion) => b.danger_level - a.danger_level)
    });
  } catch (error) {
    console.error('Error analyzing health metrics for appointment tips:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health metrics' },
      { status: 500 }
    );
  }
}

function generateAppointmentTips(metrics: HealthMetric[], userId: number): AppointmentSuggestion[] {
  const suggestions: AppointmentSuggestion[] = [];
  const now = new Date();
  
  // Group metrics by type for rule-based analysis
  const metricsByType = groupMetricsByType(metrics);
  
  // Add randomization seed that changes each time (timestamp + user ID)
  const randomSeed = userId + now.getTime() + Math.floor(Math.random() * 1000);
  const shouldIncludePreventive = (randomSeed % 3) === 0;
  const shouldIncludeSpecialist = (randomSeed % 4) === 0;
  
  // Rule-based Blood Pressure Analysis
  const bpSuggestion = analyzeBP(metricsByType.systolic_bp, metricsByType.diastolic_bp, now);
  if (bpSuggestion) suggestions.push(bpSuggestion);
  
  // Rule-based Blood Glucose Analysis
  const glucoseSuggestion = analyzeGlucose(metricsByType.blood_glucose, metricsByType.glucose, now);
  if (glucoseSuggestion) suggestions.push(glucoseSuggestion);
  
  // Rule-based HbA1c Analysis
  const hba1cSuggestion = analyzeHbA1c(metricsByType.hba1c, now);
  if (hba1cSuggestion) suggestions.push(hba1cSuggestion);
  
  // Rule-based Cholesterol Analysis
  const cholesterolSuggestion = analyzeCholesterol(metricsByType.ldl_cholesterol, metricsByType.cholesterol, now);
  if (cholesterolSuggestion) suggestions.push(cholesterolSuggestion);
  
  // Rule-based BMI/Weight Analysis
  const weightSuggestion = analyzeWeight(metricsByType.weight, metricsByType.bmi, now);
  if (weightSuggestion) suggestions.push(weightSuggestion);
  
  // Rule-based SpO2 Analysis
  const oxygenSuggestion = analyzeOxygen(metricsByType.spo2, metricsByType.oxygen_saturation, now);
  if (oxygenSuggestion) suggestions.push(oxygenSuggestion);
  
  // Rule-based Heart Rate Analysis
  const heartRateSuggestion = analyzeHeartRate(metricsByType.heart_rate, now);
  if (heartRateSuggestion) suggestions.push(heartRateSuggestion);
  
  // Rule-based Temperature Analysis
  const temperatureSuggestion = analyzeTemperature(metricsByType.temperature, now);
  if (temperatureSuggestion) suggestions.push(temperatureSuggestion);
  
  // Preventive Care Suggestions (rotated based on rules)
  if (shouldIncludePreventive || suggestions.length === 0) {
    const preventiveSuggestions = generatePreventiveCare(now, randomSeed);
    suggestions.push(...preventiveSuggestions);
  }
  
  // Specialist Consultations (rule-based rotation)
  if (shouldIncludeSpecialist && suggestions.length < 3) {
    const specialistSuggestion = generateSpecialistConsultation(now, randomSeed);
    if (specialistSuggestion) suggestions.push(specialistSuggestion);
  }
  
  // Mental Health Check (rule-based scheduling)
  if ((randomSeed % 5) === 0 && suggestions.length < 4) {
    const mentalHealthSuggestion = generateMentalHealthSuggestion(now);
    if (mentalHealthSuggestion) suggestions.push(mentalHealthSuggestion);
  }
  
  // Create umbrella suggestion if multiple issues
  if (suggestions.length > 1) {
    const umbrellaConditions = suggestions.map(s => s.title.toLowerCase()).join(', ');
    const maxDangerLevel = Math.max(...suggestions.map(s => s.danger_level)) as 1 | 2 | 3;
    
    const umbrellaSuggestion: AppointmentSuggestion = {
      id: `umbrella_${Date.now()}_${randomSeed}`,
      title: 'Comprehensive Health Review',
      specialty: 'General Practice',
      danger_level: maxDangerLevel,
      timeframe: getTimeframeForDangerLevel(maxDangerLevel),
      proposed_slots: generateProposedSlots(maxDangerLevel, now),
      reason: `Multiple health concerns detected: ${umbrellaConditions}. A comprehensive review would address all issues together.`,
      decline_consequence: 'Multiple health risks may compound without coordinated care.',
      no_show_consequence: 'Missed opportunity for comprehensive health assessment and coordinated treatment plan.',
      related_metrics: suggestions.flatMap(s => s.related_metrics),
      created_at: now.toISOString()
    };
    
    suggestions.unshift(umbrellaSuggestion);
  }
  
  // Shuffle suggestions to add variety and limit to 3-4 most relevant
  const shuffledSuggestions = shuffleArray(suggestions, randomSeed);
  return shuffledSuggestions.slice(0, 4);
}

function groupMetricsByType(metrics: HealthMetric[]): Record<string, HealthMetric[]> {
  const grouped: Record<string, HealthMetric[]> = {};
  
  metrics.forEach(metric => {
    if (!grouped[metric.metric_type]) {
      grouped[metric.metric_type] = [];
    }
    grouped[metric.metric_type].push(metric);
  });
  
  return grouped;
}

function analyzeBP(systolicMetrics: HealthMetric[] = [], diastolicMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  if (systolicMetrics.length === 0 && diastolicMetrics.length === 0) return null;
  
  // Get last 3 readings for averaging
  const recentSystolic = systolicMetrics.slice(0, 3);
  const recentDiastolic = diastolicMetrics.slice(0, 3);
  
  // Calculate averages
  const avgSystolic = recentSystolic.length > 0 
    ? recentSystolic.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / recentSystolic.length
    : 0;
  
  const avgDiastolic = recentDiastolic.length > 0
    ? recentDiastolic.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / recentDiastolic.length
    : 0;
  
  let dangerLevel: 1 | 2 | 3;
  let specialty: string;
  let title: string;
  let reason: string;
  let declineConsequence: string;
  let noShowConsequence: string;
  
  if (avgSystolic >= 160 || avgDiastolic >= 100) {
    dangerLevel = 3;
    specialty = 'Cardiology';
    title = 'Urgent Blood Pressure Management';
    reason = `Your blood pressure readings average ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg, indicating severe hypertension requiring immediate attention.`;
    declineConsequence = 'Uncontrolled hypertension significantly increases stroke and heart attack risk.';
    noShowConsequence = 'Continued high risk; emergency symptoms may be missed.';
  } else if (avgSystolic >= 140 || avgDiastolic >= 90) {
    dangerLevel = 2;
    specialty = 'General Practice';
    title = 'Blood Pressure Management';
    reason = `Your blood pressure readings average ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg, indicating hypertension that needs management.`;
    declineConsequence = 'Hypertension can damage heart, kidneys, and eyes over time.';
    noShowConsequence = 'Risk persists; medication and monitoring may be delayed.';
  } else if (avgSystolic >= 130 || avgDiastolic >= 80) {
    dangerLevel = 1;
    specialty = 'General Practice';
    title = 'Blood Pressure Monitoring';
    reason = `Your blood pressure readings average ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg, indicating elevated blood pressure.`;
    declineConsequence = 'May progress to hypertension without lifestyle changes.';
    noShowConsequence = 'Elevated blood pressure may worsen without monitoring.';
  } else {
    return null; // Normal readings
  }
  
  return {
    id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    specialty,
    danger_level: dangerLevel,
    timeframe: getTimeframeForDangerLevel(dangerLevel),
    proposed_slots: generateProposedSlots(dangerLevel, now),
    reason,
    decline_consequence: declineConsequence,
    no_show_consequence: noShowConsequence,
    related_metrics: ['systolic_bp', 'diastolic_bp', 'blood_pressure'],
    created_at: now.toISOString()
  };
}

function analyzeGlucose(glucoseMetrics: HealthMetric[] = [], altGlucoseMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  const allGlucoseMetrics = [...glucoseMetrics, ...altGlucoseMetrics];
  if (allGlucoseMetrics.length === 0) return null;
  
  const latestGlucose = allGlucoseMetrics[0];
  const value = latestGlucose.value_numeric || 0;
  
  let dangerLevel: 1 | 2 | 3;
  let specialty: string;
  let title: string;
  let reason: string;
  let declineConsequence: string;
  let noShowConsequence: string;
  
  if (value >= 180) {
    dangerLevel = 3;
    specialty = 'Endocrinology';
    title = 'Urgent Diabetes Management';
    reason = `Your latest fasting glucose reading of ${value} mg/dL indicates severe hyperglycemia requiring immediate attention.`;
    declineConsequence = 'High risk of acute diabetic complications and organ damage.';
    noShowConsequence = 'Poor glucose control can lead to neuropathy, kidney, and eye disease.';
  } else if (value >= 126) {
    dangerLevel = 2;
    specialty = 'Endocrinology';
    title = 'Diabetes Management';
    reason = `Your latest fasting glucose reading of ${value} mg/dL indicates diabetes that needs management.`;
    declineConsequence = 'Diabetes progression likely without proper treatment adjustment.';
    noShowConsequence = 'Uncontrolled diabetes increases risk of serious complications.';
  } else if (value >= 100) {
    dangerLevel = 1;
    specialty = 'General Practice';
    title = 'Prediabetes Consultation';
    reason = `Your latest fasting glucose reading of ${value} mg/dL indicates prediabetes.`;
    declineConsequence = 'Prediabetes may progress to diabetes without lifestyle changes.';
    noShowConsequence = 'Missed opportunity for diabetes prevention strategies.';
  } else {
    return null; // Normal readings
  }
  
  return {
    id: `glucose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    specialty,
    danger_level: dangerLevel,
    timeframe: getTimeframeForDangerLevel(dangerLevel),
    proposed_slots: generateProposedSlots(dangerLevel, now),
    reason,
    decline_consequence: declineConsequence,
    no_show_consequence: noShowConsequence,
    related_metrics: ['blood_glucose', 'glucose', 'fasting_glucose'],
    created_at: now.toISOString()
  };
}

function analyzeHbA1c(hba1cMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  if (hba1cMetrics.length === 0) return null;
  
  const latest = hba1cMetrics[0];
  const value = latest.value_numeric || 0;
  
  let dangerLevel: 1 | 2 | 3;
  let specialty: string;
  let title: string;
  let reason: string;
  let declineConsequence: string;
  let noShowConsequence: string;
  
  if (value >= 8.5) {
    dangerLevel = 3;
    specialty = 'Endocrinology';
    title = 'Critical Diabetes Management';
    reason = `Your HbA1c of ${value}% indicates poor long-term glucose control requiring immediate intervention.`;
    declineConsequence = 'High risk of acute complications and accelerated organ damage.';
    noShowConsequence = 'Poor control can lead to severe neuropathy, kidney, and eye disease.';
  } else if (value >= 7.0) {
    dangerLevel = 2;
    specialty = 'Endocrinology';
    title = 'Diabetes Management Review';
    reason = `Your HbA1c of ${value}% indicates suboptimal diabetes control.`;
    declineConsequence = 'Diabetes progression likely without treatment adjustment.';
    noShowConsequence = 'Continued poor control increases complication risk.';
  } else if (value >= 5.7) {
    dangerLevel = 1;
    specialty = 'General Practice';
    title = 'Prediabetes Management';
    reason = `Your HbA1c of ${value}% indicates prediabetes.`;
    declineConsequence = 'Prediabetes may progress without lifestyle intervention.';
    noShowConsequence = 'Missed diabetes prevention opportunity.';
  } else {
    return null;
  }
  
  return {
    id: `hba1c_${Date.now()}`,
    title,
    specialty,
    danger_level: dangerLevel,
    timeframe: getTimeframeForDangerLevel(dangerLevel),
    proposed_slots: generateProposedSlots(dangerLevel, now),
    reason,
    decline_consequence: declineConsequence,
    no_show_consequence: noShowConsequence,
    related_metrics: ['hba1c', 'hemoglobin_a1c'],
    created_at: now.toISOString()
  };
}

function analyzeCholesterol(ldlMetrics: HealthMetric[] = [], cholesterolMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  const allCholesterolMetrics = [...ldlMetrics, ...cholesterolMetrics];
  if (allCholesterolMetrics.length === 0) return null;
  
  const latest = allCholesterolMetrics[0];
  const value = latest.value_numeric || 0;
  
  let dangerLevel: 1 | 2;
  let specialty: string;
  let title: string;
  let reason: string;
  let declineConsequence: string;
  let noShowConsequence: string;
  
  if (value >= 190) {
    dangerLevel = 2;
    specialty = 'Cardiology';
    title = 'High Cholesterol Management';
    reason = `Your LDL cholesterol of ${value} mg/dL is very high and requires medical attention.`;
    declineConsequence = 'Elevated cardiovascular disease risk; statin therapy may be needed.';
    noShowConsequence = 'Continued high cholesterol increases heart attack and stroke risk.';
  } else if (value >= 160) {
    dangerLevel = 1;
    specialty = 'General Practice';
    title = 'Cholesterol Review';
    reason = `Your LDL cholesterol of ${value} mg/dL is borderline high.`;
    declineConsequence = 'Cardiovascular risk may increase without intervention.';
    noShowConsequence = 'Missed opportunity for cardiovascular risk reduction.';
  } else {
    return null;
  }
  
  return {
    id: `cholesterol_${Date.now()}`,
    title,
    specialty,
    danger_level: dangerLevel,
    timeframe: getTimeframeForDangerLevel(dangerLevel),
    proposed_slots: generateProposedSlots(dangerLevel, now),
    reason,
    decline_consequence: declineConsequence,
    no_show_consequence: noShowConsequence,
    related_metrics: ['ldl_cholesterol', 'cholesterol', 'total_cholesterol'],
    created_at: now.toISOString()
  };
}

function analyzeWeight(weightMetrics: HealthMetric[] = [], bmiMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  if (weightMetrics.length === 0 && bmiMetrics.length === 0) return null;
  
  let bmi: number | null = null;
  let weightChange: number | null = null;
  
  // Calculate BMI from latest reading
  if (bmiMetrics.length > 0) {
    bmi = bmiMetrics[0].value_numeric || null;
  }
  
  // Calculate weight change if we have multiple readings
  if (weightMetrics.length >= 2) {
    const latest = weightMetrics[0].value_numeric || 0;
    const previous = weightMetrics[1].value_numeric || 0;
    const timeDiff = new Date(weightMetrics[0].metric_date).getTime() - new Date(weightMetrics[1].metric_date).getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 0 && previous > 0) {
      weightChange = ((latest - previous) / previous) * 100 * (30 / daysDiff); // Monthly change rate
    }
  }
  
  let dangerLevel: 1 | 2;
  let specialty: string;
  let title: string;
  let reason: string;
  let declineConsequence: string;
  let noShowConsequence: string;
  
  if (bmi && bmi >= 30) {
    dangerLevel = 1;
    specialty = 'General Practice';
    title = 'Weight Management Consultation';
    reason = `Your BMI of ${bmi.toFixed(1)} indicates obesity.`;
    declineConsequence = 'Higher risk for diabetes, hypertension, and joint problems.';
    noShowConsequence = 'Continued health risks from obesity without intervention.';
  } else if (bmi && bmi < 18.5) {
    dangerLevel = 2;
    specialty = 'General Practice';
    title = 'Underweight Assessment';
    reason = `Your BMI of ${bmi.toFixed(1)} indicates you are underweight.`;
    declineConsequence = 'Could indicate malnutrition or underlying illness.';
    noShowConsequence = 'Potential underlying health issues may go undiagnosed.';
  } else if (weightChange && Math.abs(weightChange) >= 5) {
    dangerLevel = weightChange > 0 ? 1 : 2;
    specialty = 'General Practice';
    title = 'Significant Weight Change Review';
    reason = `You've experienced a ${Math.abs(weightChange).toFixed(1)}% monthly weight ${weightChange > 0 ? 'gain' : 'loss'}.`;
    declineConsequence = 'Rapid weight changes may indicate underlying health issues.';
    noShowConsequence = 'Potential medical causes of weight change may be missed.';
  } else {
    return null;
  }
  
  return {
    id: `weight_${Date.now()}`,
    title,
    specialty,
    danger_level: dangerLevel,
    timeframe: getTimeframeForDangerLevel(dangerLevel),
    proposed_slots: generateProposedSlots(dangerLevel, now),
    reason,
    decline_consequence: declineConsequence,
    no_show_consequence: noShowConsequence,
    related_metrics: ['weight', 'bmi'],
    created_at: now.toISOString()
  };
}

function analyzeOxygen(spo2Metrics: HealthMetric[] = [], oxygenMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  const allOxygenMetrics = [...spo2Metrics, ...oxygenMetrics];
  if (allOxygenMetrics.length === 0) return null;
  
  // Check for repeated low readings
  const lowReadings = allOxygenMetrics.filter(m => (m.value_numeric || 100) <= 90).slice(0, 2);
  
  if (lowReadings.length >= 2) {
    const avgValue = lowReadings.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / lowReadings.length;
    
    return {
      id: `oxygen_${Date.now()}`,
      title: 'Urgent Oxygen Saturation Assessment',
      specialty: 'Emergency Medicine',
      danger_level: 3,
      timeframe: 'within 24-72 hours',
      proposed_slots: generateProposedSlots(3, now),
      reason: `Your oxygen saturation readings of ${avgValue.toFixed(1)}% are critically low and require immediate evaluation.`,
      decline_consequence: 'Hypoxemia can be a medical emergency.',
      no_show_consequence: 'Life-threatening respiratory issues may go untreated.',
      related_metrics: ['spo2', 'oxygen_saturation'],
      created_at: now.toISOString()
    };
  }
  
  return null;
}

function getTimeframeForDangerLevel(dangerLevel: 1 | 2 | 3): string {
  switch (dangerLevel) {
    case 3: return MEDICAL_CONFIG.APPOINTMENT_TIMEFRAMES.HIGH_PRIORITY;
    case 2: return MEDICAL_CONFIG.APPOINTMENT_TIMEFRAMES.MEDIUM_PRIORITY;
    case 1: return MEDICAL_CONFIG.APPOINTMENT_TIMEFRAMES.LOW_PRIORITY;
  }
}

function generateProposedSlots(dangerLevel: 1 | 2 | 3, now: Date): string[] {
  const slots: string[] = [];
  const startDate = new Date(now);
  
  let daysToAdd: number[];
  switch (dangerLevel) {
    case 3: daysToAdd = [1, 3, 5]; break;
    case 2: daysToAdd = [5, 8, 12]; break;
    case 1: daysToAdd = [28, 35, 42]; break;
  }
  
  // Add some randomization to appointment times
  const timeVariations = [
    { hour: 9, minute: 0 },
    { hour: 10, minute: 30 },
    { hour: 14, minute: 0 },
    { hour: 15, minute: 30 },
    { hour: 16, minute: 0 }
  ];
  
  daysToAdd.forEach((days, index) => {
    const appointmentDate = new Date(startDate);
    appointmentDate.setDate(appointmentDate.getDate() + days);
    
    // Use different times for variety
    const timeVar = timeVariations[index % timeVariations.length];
    appointmentDate.setHours(timeVar.hour, timeVar.minute, 0, 0);
    
    // Skip weekends
    if (appointmentDate.getDay() === 0) appointmentDate.setDate(appointmentDate.getDate() + 1);
    if (appointmentDate.getDay() === 6) appointmentDate.setDate(appointmentDate.getDate() + 2);
    
    // Format as YYYY-MM-DD HH:MM without seconds/milliseconds
    const year = appointmentDate.getFullYear();
    const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
    const day = String(appointmentDate.getDate()).padStart(2, '0');
    const hours = String(appointmentDate.getHours()).padStart(2, '0');
    const minutes = String(appointmentDate.getMinutes()).padStart(2, '0');
    
    slots.push(`${year}-${month}-${day} ${hours}:${minutes}`);
  });
  
  return slots;
}

function analyzeHeartRate(heartRateMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  if (heartRateMetrics.length === 0) return null;
  
  const recentHR = heartRateMetrics.slice(0, 3);
  const avgHR = recentHR.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / recentHR.length;
  
  if (avgHR > 100) {
    return {
      id: `hr_high_${Date.now()}`,
      title: 'Elevated Heart Rate Assessment',
      specialty: 'Cardiology',
      danger_level: 2,
      timeframe: getTimeframeForDangerLevel(2),
      proposed_slots: generateProposedSlots(2, now),
      reason: `Your average resting heart rate of ${Math.round(avgHR)} bpm is elevated and should be evaluated.`,
      decline_consequence: 'Persistent tachycardia may indicate underlying cardiac issues.',
      no_show_consequence: 'Potential heart rhythm disorders may go undiagnosed.',
      related_metrics: ['heart_rate'],
      created_at: now.toISOString()
    };
  } else if (avgHR < 50) {
    return {
      id: `hr_low_${Date.now()}`,
      title: 'Low Heart Rate Evaluation',
      specialty: 'Cardiology',
      danger_level: 2,
      timeframe: getTimeframeForDangerLevel(2),
      proposed_slots: generateProposedSlots(2, now),
      reason: `Your average resting heart rate of ${Math.round(avgHR)} bpm is unusually low.`,
      decline_consequence: 'Bradycardia may indicate medication effects or cardiac conduction issues.',
      no_show_consequence: 'Underlying causes of slow heart rate may be missed.',
      related_metrics: ['heart_rate'],
      created_at: now.toISOString()
    };
  }
  
  return null;
}

function analyzeTemperature(temperatureMetrics: HealthMetric[] = [], now: Date): AppointmentSuggestion | null {
  if (temperatureMetrics.length === 0) return null;
  
  const recent = temperatureMetrics.slice(0, 2);
  const feverReadings = recent.filter(m => (m.value_numeric || 0) >= 38.0);
  
  if (feverReadings.length >= 2) {
    const avgTemp = feverReadings.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / feverReadings.length;
    
    return {
      id: `fever_${Date.now()}`,
      title: 'Persistent Fever Evaluation',
      specialty: 'General Practice',
      danger_level: 2,
      timeframe: 'within 1-2 days',
      proposed_slots: generateProposedSlots(2, now),
      reason: `You've had persistent fever averaging ${avgTemp.toFixed(1)}°C that requires medical evaluation.`,
      decline_consequence: 'Ongoing fever may indicate serious infection or other medical conditions.',
      no_show_consequence: 'Underlying cause of fever may worsen without treatment.',
      related_metrics: ['temperature'],
      created_at: now.toISOString()
    };
  }
  
  return null;
}

function generatePreventiveCare(now: Date, randomSeed: number): AppointmentSuggestion[] {
  const suggestions: AppointmentSuggestion[] = [];
  const preventiveOptions = [
    {
      title: 'Annual Physical Examination',
      specialty: 'General Practice',
      reason: 'Regular comprehensive health screenings help detect issues early and maintain optimal health.',
      id_suffix: 'annual_physical'
    },
    {
      title: 'Dental Cleaning & Checkup',
      specialty: 'Dentistry',
      reason: 'Regular dental care prevents gum disease and maintains oral health, which impacts overall wellness.',
      id_suffix: 'dental'
    },
    {
      title: 'Eye Examination',
      specialty: 'Ophthalmology',
      reason: 'Annual eye exams detect vision changes and eye diseases like glaucoma early.',
      id_suffix: 'eye_exam'
    },
    {
      title: 'Dermatology Screening',
      specialty: 'Dermatology',
      reason: 'Annual skin cancer screening is important for early detection of suspicious moles or lesions.',
      id_suffix: 'skin_screening'
    },
    {
      title: 'Vaccination Update',
      specialty: 'General Practice',
      reason: 'Ensure your immunizations are up-to-date including flu shot and other recommended vaccines.',
      id_suffix: 'vaccines'
    }
  ];
  
  // Select 1-2 preventive care suggestions based on randomSeed
  const selectedCount = (randomSeed % 2) + 1;
  const startIndex = randomSeed % preventiveOptions.length;
  
  for (let i = 0; i < selectedCount; i++) {
    const option = preventiveOptions[(startIndex + i) % preventiveOptions.length];
    suggestions.push({
      id: `preventive_${option.id_suffix}_${Date.now()}`,
      title: option.title,
      specialty: option.specialty,
      danger_level: 1,
      timeframe: getTimeframeForDangerLevel(1),
      proposed_slots: generateProposedSlots(1, now),
      reason: option.reason,
      decline_consequence: 'Preventive care helps catch health issues before they become serious problems.',
      no_show_consequence: 'Missing preventive care may lead to undetected health conditions.',
      related_metrics: [],
      created_at: now.toISOString()
    });
  }
  
  return suggestions;
}

function generateSpecialistConsultation(now: Date, randomSeed: number): AppointmentSuggestion | null {
  const specialists = [
    {
      title: 'Nutritionist Consultation',
      specialty: 'Nutrition',
      reason: 'A nutritionist can help optimize your diet for better health outcomes and energy levels.',
    },
    {
      title: 'Physical Therapy Assessment',
      specialty: 'Physical Therapy',
      reason: 'Evaluate posture, movement patterns, and address any musculoskeletal concerns.',
    },
    {
      title: 'Sleep Study Consultation',
      specialty: 'Sleep Medicine',
      reason: 'Poor sleep quality can significantly impact your overall health and well-being.',
    },
    {
      title: 'Stress Management Consultation',
      specialty: 'Psychology',
      reason: 'Learn effective stress management techniques to improve your mental and physical health.',
    }
  ];
  
  const selected = specialists[randomSeed % specialists.length];
  
  return {
    id: `specialist_${Date.now()}`,
    title: selected.title,
    specialty: selected.specialty,
    danger_level: 1,
    timeframe: getTimeframeForDangerLevel(1),
    proposed_slots: generateProposedSlots(1, now),
    reason: selected.reason,
    decline_consequence: 'Specialized care can provide targeted improvements to your health.',
    no_show_consequence: 'Missing specialized consultation may limit health optimization opportunities.',
    related_metrics: [],
    created_at: now.toISOString()
  };
}

function generateMentalHealthSuggestion(now: Date): AppointmentSuggestion {
  return {
    id: `mental_health_${Date.now()}`,
    title: 'Mental Health Wellness Check',
    specialty: 'Psychology',
    danger_level: 1,
    timeframe: getTimeframeForDangerLevel(1),
    proposed_slots: generateProposedSlots(1, now),
    reason: 'Regular mental health check-ins support emotional well-being and stress management.',
    decline_consequence: 'Mental health is as important as physical health for overall wellness.',
    no_show_consequence: 'Neglecting mental health can impact physical health and quality of life.',
    related_metrics: [],
    created_at: now.toISOString()
  };
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  
  // Use seed for deterministic but varied shuffling
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;
    
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}
