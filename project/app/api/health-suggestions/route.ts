import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

interface HealthMetric {
  id: number;
  metric_date: string;
  metric_type: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
}

interface HealthSuggestion {
  id: string;
  suggestion_text: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  related_metrics: string[];
  created_at: string;
}

// GET - Retrieve existing suggestions from database
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await pool.query(
      'SELECT id, suggestion_text, generated_at, read FROM health_suggestions WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 20',
      [user.id]
    );
    
    const suggestions = result.rows.map(row => ({
      id: row.id,
      suggestion_text: row.suggestion_text,
      read: row.read,
      generated_at: row.generated_at
    }));
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching health suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health suggestions' },
      { status: 500 }
    );
  }
}

// PATCH - Mark suggestion as read
export async function PATCH(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await request.json();
    
    await pool.query(
      'UPDATE health_suggestions SET read = true WHERE id = $1 AND user_id = $2',
      [id, user.id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}

// POST - Generate new AI-driven suggestions based on health metrics
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
      LIMIT 50
    `;
    
    const metricsResult = await pool.query(metricsQuery, [user.id]);
    const metrics = metricsResult.rows as HealthMetric[];

    const suggestions = generateHealthSuggestions(metrics, user.id);
    
    // Save suggestions to database
    for (const suggestion of suggestions) {
      await pool.query(`
        INSERT INTO health_suggestions (user_id, suggestion_text, generated_at, read)
        VALUES ($1, $2, NOW(), false)
        ON CONFLICT DO NOTHING
      `, [user.id, suggestion.suggestion_text]);
    }
    
    return NextResponse.json({ 
      success: true, 
      suggestions: suggestions.map(s => ({
        id: parseInt(s.id),
        suggestion_text: s.suggestion_text,
        read: false
      }))
    });
  } catch (error) {
    console.error('Error generating health suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate health suggestions' },
      { status: 500 }
    );
  }
}

function generateHealthSuggestions(metrics: HealthMetric[], userId: number): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];
  const now = new Date();
  
  // Create randomization seed that changes each time for variety
  const randomSeed = userId + now.getTime() + Math.floor(Math.random() * 1000);
  
  // Group metrics by type for analysis
  const metricsByType = groupMetricsByType(metrics);
  
  // Blood Pressure Suggestions
  const bpSuggestions = analyzeBPForSuggestions(metricsByType.systolic_bp, metricsByType.diastolic_bp, now, randomSeed);
  suggestions.push(...bpSuggestions);
  
  // Weight/BMI Suggestions
  const weightSuggestions = analyzeWeightForSuggestions(metricsByType.weight, metricsByType.bmi, now, randomSeed);
  suggestions.push(...weightSuggestions);
  
  // Heart Rate Suggestions
  const hrSuggestions = analyzeHeartRateForSuggestions(metricsByType.heart_rate, now, randomSeed);
  suggestions.push(...hrSuggestions);
  
  // Blood Glucose Suggestions
  const glucoseSuggestions = analyzeGlucoseForSuggestions(metricsByType.blood_glucose, metricsByType.glucose, now, randomSeed);
  suggestions.push(...glucoseSuggestions);
  
  // General Wellness Suggestions (always include some)
  const wellnessSuggestions = generateGeneralWellnessSuggestions(now, randomSeed);
  suggestions.push(...wellnessSuggestions);
  
  // Activity/Exercise Suggestions
  const exerciseSuggestions = generateExerciseSuggestions(now, randomSeed);
  suggestions.push(...exerciseSuggestions);
  
  // Nutrition Suggestions
  const nutritionSuggestions = generateNutritionSuggestions(now, randomSeed);
  suggestions.push(...nutritionSuggestions);
  
  // Sleep and Lifestyle Suggestions
  const lifestyleSuggestions = generateLifestyleSuggestions(now, randomSeed);
  suggestions.push(...lifestyleSuggestions);
  
  // Shuffle and limit suggestions for variety
  const shuffledSuggestions = shuffleArray(suggestions, randomSeed);
  return shuffledSuggestions.slice(0, 5);
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

function analyzeBPForSuggestions(systolicMetrics: HealthMetric[] = [], diastolicMetrics: HealthMetric[] = [], now: Date, seed: number): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];
  
  if (systolicMetrics.length === 0 && diastolicMetrics.length === 0) {
    suggestions.push({
      id: `bp_track_${Date.now()}`,
      suggestion_text: "Start tracking your blood pressure regularly to monitor cardiovascular health.",
      category: "Blood Pressure",
      priority: "medium",
      related_metrics: ["blood_pressure"],
      created_at: now.toISOString()
    });
    return suggestions;
  }
  
  const recentSystolic = systolicMetrics.slice(0, 3);
  const recentDiastolic = diastolicMetrics.slice(0, 3);
  
  const avgSystolic = recentSystolic.length > 0 
    ? recentSystolic.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / recentSystolic.length
    : 0;
  
  const avgDiastolic = recentDiastolic.length > 0
    ? recentDiastolic.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / recentDiastolic.length
    : 0;
  
  if (avgSystolic >= 140 || avgDiastolic >= 90) {
    suggestions.push({
      id: `bp_high_${Date.now()}`,
      suggestion_text: "Your blood pressure readings are elevated. Consider reducing sodium intake, increasing physical activity, and managing stress.",
      category: "Blood Pressure",
      priority: "high",
      related_metrics: ["systolic_bp", "diastolic_bp"],
      created_at: now.toISOString()
    });
  } else if (avgSystolic >= 130 || avgDiastolic >= 80) {
    suggestions.push({
      id: `bp_borderline_${Date.now()}`,
      suggestion_text: "Your blood pressure is in the elevated range. Focus on regular exercise, a heart-healthy diet, and stress management.",
      category: "Blood Pressure",
      priority: "medium",
      related_metrics: ["systolic_bp", "diastolic_bp"],
      created_at: now.toISOString()
    });
  } else {
    suggestions.push({
      id: `bp_good_${Date.now()}`,
      suggestion_text: "Great job maintaining healthy blood pressure! Keep up with regular exercise and a balanced diet.",
      category: "Blood Pressure",
      priority: "low",
      related_metrics: ["systolic_bp", "diastolic_bp"],
      created_at: now.toISOString()
    });
  }
  
  return suggestions;
}

function analyzeWeightForSuggestions(weightMetrics: HealthMetric[] = [], bmiMetrics: HealthMetric[] = [], now: Date, seed: number): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];
  
  if (weightMetrics.length === 0 && bmiMetrics.length === 0) {
    suggestions.push({
      id: `weight_track_${Date.now()}`,
      suggestion_text: "Consider tracking your weight and BMI regularly to monitor overall health trends.",
      category: "Weight Management",
      priority: "medium",
      related_metrics: ["weight", "bmi"],
      created_at: now.toISOString()
    });
    return suggestions;
  }
  
  let bmi: number | null = null;
  if (bmiMetrics.length > 0) {
    bmi = bmiMetrics[0].value_numeric;
  }
  
  // Calculate weight change trend
  if (weightMetrics.length >= 2) {
    const latest = weightMetrics[0].value_numeric || 0;
    const previous = weightMetrics[1].value_numeric || 0;
    const change = latest - previous;
    
    if (Math.abs(change) >= 2) {
      suggestions.push({
        id: `weight_change_${Date.now()}`,
        suggestion_text: `You've had a ${change > 0 ? 'gain' : 'loss'} of ${Math.abs(change).toFixed(1)}kg. Consider ${change > 0 ? 'reviewing your diet and exercise routine' : 'ensuring adequate nutrition and consulting a healthcare provider if unintentional'}.`,
        category: "Weight Management",
        priority: "medium",
        related_metrics: ["weight"],
        created_at: now.toISOString()
      });
    }
  }
  
  if (bmi) {
    if (bmi >= 30) {
      suggestions.push({
        id: `bmi_obese_${Date.now()}`,
        suggestion_text: "Your BMI indicates obesity. Consider consulting a nutritionist and incorporating regular physical activity into your routine.",
        category: "Weight Management",
        priority: "high",
        related_metrics: ["bmi", "weight"],
        created_at: now.toISOString()
      });
    } else if (bmi >= 25) {
      suggestions.push({
        id: `bmi_overweight_${Date.now()}`,
        suggestion_text: "Your BMI is in the overweight range. Focus on portion control, balanced nutrition, and regular exercise.",
        category: "Weight Management",
        priority: "medium",
        related_metrics: ["bmi", "weight"],
        created_at: now.toISOString()
      });
    } else if (bmi < 18.5) {
      suggestions.push({
        id: `bmi_underweight_${Date.now()}`,
        suggestion_text: "Your BMI indicates you're underweight. Consider increasing caloric intake with nutrient-dense foods and consulting a healthcare provider.",
        category: "Weight Management",
        priority: "medium",
        related_metrics: ["bmi", "weight"],
        created_at: now.toISOString()
      });
    }
  }
  
  return suggestions;
}

function analyzeHeartRateForSuggestions(heartRateMetrics: HealthMetric[] = [], now: Date, seed: number): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];
  
  if (heartRateMetrics.length === 0) {
    if (seed % 3 === 0) {
      suggestions.push({
        id: `hr_track_${Date.now()}`,
        suggestion_text: "Consider tracking your resting heart rate to monitor cardiovascular fitness improvements over time.",
        category: "Cardiovascular Health",
        priority: "low",
        related_metrics: ["heart_rate"],
        created_at: now.toISOString()
      });
    }
    return suggestions;
  }
  
  const recentHR = heartRateMetrics.slice(0, 3);
  const avgHR = recentHR.reduce((sum, m) => sum + (m.value_numeric || 0), 0) / recentHR.length;
  
  if (avgHR > 100) {
    suggestions.push({
      id: `hr_high_${Date.now()}`,
      suggestion_text: "Your resting heart rate is elevated. Practice relaxation techniques, ensure adequate sleep, and consider consulting a healthcare provider.",
      category: "Cardiovascular Health",
      priority: "medium",
      related_metrics: ["heart_rate"],
      created_at: now.toISOString()
    });
  } else if (avgHR >= 60 && avgHR <= 80) {
    suggestions.push({
      id: `hr_good_${Date.now()}`,
      suggestion_text: "Your heart rate is in a healthy range! Regular cardio exercise can help improve your cardiovascular fitness further.",
      category: "Cardiovascular Health",
      priority: "low",
      related_metrics: ["heart_rate"],
      created_at: now.toISOString()
    });
  }
  
  return suggestions;
}

function analyzeGlucoseForSuggestions(glucoseMetrics: HealthMetric[] = [], altGlucoseMetrics: HealthMetric[] = [], now: Date, seed: number): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];
  const allGlucose = [...glucoseMetrics, ...altGlucoseMetrics];
  
  if (allGlucose.length === 0) {
    if (seed % 4 === 0) {
      suggestions.push({
        id: `glucose_awareness_${Date.now()}`,
        suggestion_text: "Consider periodic blood glucose monitoring, especially if you have risk factors for diabetes.",
        category: "Blood Sugar",
        priority: "low",
        related_metrics: ["blood_glucose"],
        created_at: now.toISOString()
      });
    }
    return suggestions;
  }
  
  const latest = allGlucose[0];
  const value = latest.value_numeric || 0;
  
  if (value >= 126) {
    suggestions.push({
      id: `glucose_high_${Date.now()}`,
      suggestion_text: "Your blood glucose levels are elevated. Focus on low-glycemic foods, regular exercise, and consider consulting an endocrinologist.",
      category: "Blood Sugar",
      priority: "high",
      related_metrics: ["blood_glucose", "glucose"],
      created_at: now.toISOString()
    });
  } else if (value >= 100) {
    suggestions.push({
      id: `glucose_prediabetic_${Date.now()}`,
      suggestion_text: "Your blood glucose is in the prediabetic range. Adopt a low-sugar diet, increase physical activity, and maintain a healthy weight.",
      category: "Blood Sugar",
      priority: "medium",
      related_metrics: ["blood_glucose", "glucose"],
      created_at: now.toISOString()
    });
  }
  
  return suggestions;
}

function generateGeneralWellnessSuggestions(now: Date, seed: number): HealthSuggestion[] {
  const wellnessTips = [
    "Stay hydrated by drinking at least 8 glasses of water daily.",
    "Aim for 7-9 hours of quality sleep each night for optimal health.",
    "Take short breaks every hour if you work at a desk to reduce strain.",
    "Practice deep breathing exercises for 5 minutes daily to reduce stress.",
    "Include more colorful fruits and vegetables in your daily meals.",
    "Consider taking a daily multivitamin to support overall nutrition.",
    "Limit screen time before bed to improve sleep quality.",
    "Practice good posture throughout the day to prevent back pain.",
    "Consider meditation or mindfulness practices for mental well-being.",
    "Wash your hands frequently to prevent illness.",
  ];
  
  const selectedCount = (seed % 2) + 1;
  const startIndex = seed % wellnessTips.length;
  const suggestions: HealthSuggestion[] = [];
  
  for (let i = 0; i < selectedCount; i++) {
    const tip = wellnessTips[(startIndex + i) % wellnessTips.length];
    suggestions.push({
      id: `wellness_${Date.now()}_${i}`,
      suggestion_text: tip,
      category: "General Wellness",
      priority: "low",
      related_metrics: [],
      created_at: now.toISOString()
    });
  }
  
  return suggestions;
}

function generateExerciseSuggestions(now: Date, seed: number): HealthSuggestion[] {
  const exerciseTips = [
    "Aim for at least 150 minutes of moderate-intensity aerobic activity per week.",
    "Include strength training exercises at least 2 days per week.",
    "Try taking a 10-minute walk after meals to help with digestion and blood sugar control.",
    "Consider yoga or stretching routines to improve flexibility and reduce stress.",
    "Take the stairs instead of elevators when possible for extra daily activity.",
    "Try high-intensity interval training (HIIT) for efficient cardiovascular workouts.",
    "Include balance exercises in your routine to prevent falls as you age.",
    "Find physical activities you enjoy to make exercise feel less like a chore.",
  ];
  
  if (seed % 3 === 0) {
    const tip = exerciseTips[seed % exerciseTips.length];
    return [{
      id: `exercise_${Date.now()}`,
      suggestion_text: tip,
      category: "Exercise & Fitness",
      priority: "medium",
      related_metrics: [],
      created_at: now.toISOString()
    }];
  }
  
  return [];
}

function generateNutritionSuggestions(now: Date, seed: number): HealthSuggestion[] {
  const nutritionTips = [
    "Follow the Mediterranean diet pattern for heart and brain health.",
    "Limit processed foods and choose whole, unprocessed options when possible.",
    "Include omega-3 rich foods like fish, walnuts, and flaxseeds in your diet.",
    "Practice portion control by using smaller plates and eating slowly.",
    "Limit added sugars to less than 10% of your daily caloric intake.",
    "Include probiotic foods like yogurt and fermented vegetables for gut health.",
    "Plan your meals in advance to make healthier food choices.",
    "Read nutrition labels to make informed food choices.",
  ];
  
  if (seed % 4 === 1) {
    const tip = nutritionTips[seed % nutritionTips.length];
    return [{
      id: `nutrition_${Date.now()}`,
      suggestion_text: tip,
      category: "Nutrition",
      priority: "medium",
      related_metrics: [],
      created_at: now.toISOString()
    }];
  }
  
  return [];
}

function generateLifestyleSuggestions(now: Date, seed: number): HealthSuggestion[] {
  const lifestyleTips = [
    "Maintain social connections as they're important for mental and physical health.",
    "Spend time in nature regularly to reduce stress and improve mood.",
    "Limit alcohol consumption to moderate levels for better health outcomes.",
    "Avoid smoking and secondhand smoke to protect your lungs and heart.",
    "Practice stress management techniques like journaling or hobbies you enjoy.",
    "Consider regular health screenings appropriate for your age and risk factors.",
    "Create a relaxing bedtime routine to improve sleep quality.",
    "Practice gratitude by writing down three things you're thankful for each day.",
  ];
  
  if (seed % 5 === 2) {
    const tip = lifestyleTips[seed % lifestyleTips.length];
    return [{
      id: `lifestyle_${Date.now()}`,
      suggestion_text: tip,
      category: "Lifestyle",
      priority: "low",
      related_metrics: [],
      created_at: now.toISOString()
    }];
  }
  
  return [];
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