// src/components/Recommendations.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import "./Recommendations.css";

const Recommendations = () => {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [userData, setUserData] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [latestCheckin, setLatestCheckin] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  // Utility mappers / parsers (unchanged)
  const numericLevel = (val) => {
    if (val == null) return null;
    if (typeof val === "number") return val;
    const s = String(val).trim();
    if (s === "") return null;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const lc = s.toLowerCase();
    if (lc === "very low") return 1;
    if (lc === "very high") return 6;
    if (lc === "low") return 2;
    if (lc === "high") return 5;
    return null;
  };

  const parseDailySteps = (val) => {
    if (val == null) return { kind: "unknown" };
    if (typeof val === "number") return { kind: "number", value: val };
    const s = String(val).trim();
    if (/^\d+$/.test(s)) return { kind: "number", value: parseInt(s, 10) };
    const lc = s.toLowerCase();
    if (lc.includes("not")) return { kind: "not_tracked" };
    if (lc.includes("less than")) {
      const m = s.match(/(\d+)/);
      if (m) return { kind: "range", max: parseInt(m[1], 10) - 1 };
      return { kind: "range", max: 3000 };
    }
    if (lc.includes("more than")) {
      const m = s.match(/(\d+)/);
      if (m) return { kind: "range", min: parseInt(m[1], 10) + 1 };
      return { kind: "range", min: 10000 };
    }
    if (lc.includes("-")) {
      const parts = lc.split("-").map((p) => p.replace(/\D/g, "")).filter(Boolean);
      if (parts.length === 2) {
        return { kind: "range", min: parseInt(parts[0], 10), max: parseInt(parts[1], 10) };
      }
    }
    return { kind: "unknown" };
  };

  const parseWaterIntake = (val) => {
    if (!val) return null;
    if (typeof val === "number") return val;
    const s = String(val).toLowerCase();
    if (s.includes("less than 1")) return 0.8;
    if (s.includes("1-2")) return 1.5;
    if (s.includes("2-3")) return 2.5;
    if (s.includes("3-4")) return 3.5;
    if (s.includes("more than")) {
      const m = s.match(/(\d+)/);
      if (m) return parseFloat(m[1]) + 0.5;
      return 4.5;
    }
    return null;
  };

  const parseExerciseDays = (val) => {
  if (!val) return null;

  const s = String(val).toLowerCase().trim();

  if (s === "0" || s.includes("no exercise")) return 0;
  if (s.includes("1-2")) return 1.5;
  if (s.includes("3-4")) return 3.5;
  if (s.includes("5-6")) return 5.5;
  if (s.includes("every")) return 7;

  return null;
};
  const detectSleepDisorder = (predictionData) => {
    if (!predictionData) return false;
    const keys = Object.keys(predictionData || {});
    const lowered = {};
    keys.forEach((k) => {
      const v = predictionData[k];
      lowered[k.toLowerCase()] = v;
    });

    if ("sleepdisorder" in lowered) {
      const v = lowered["sleepdisorder"];
      if (typeof v === "boolean") return v;
      const sv = String(v).toLowerCase();
      if (sv === "yes" || sv === "true" || sv === "positive") return true;
    }
    if ("predictedlabel" in lowered) {
      const sv = String(lowered["predictedlabel"]).toLowerCase();
      if (sv.includes("sleep") && sv.includes("disorder")) return true;
      if (sv.includes("positive") || sv.includes("abnormal")) return true;
    }
    if ("prediction" in lowered) {
      const sv = String(lowered["prediction"]).toLowerCase();
      if (sv.includes("disorder") || sv.includes("positive") || sv.includes("abnormal")) return true;
    }
    if ("label" in lowered) {
      const sv = String(lowered["label"]).toLowerCase();
      if (sv.includes("disorder") || sv.includes("apnea") || sv.includes("insomnia")) return true;
    }

    const qualityKey = Object.keys(lowered).find((k) => k.includes("quality"));
    const durationKey = Object.keys(lowered).find((k) => k.includes("sleep") && k.includes("duration"));
    try {
      const quality = qualityKey ? String(lowered[qualityKey]).toLowerCase() : null;
      const duration = durationKey ? lowered[durationKey] : null;
      const durationNumeric = typeof duration === "number" ? duration : parseFloat(String(duration).replace(/[^\d.]/g, ""));
      if (quality && (quality.includes("poor") || quality.includes("low")) && !isNaN(durationNumeric) && durationNumeric < 5.5) {
        return true;
      }
    } catch (e) {
      // ignore
    }

    return false;
  };

  // Generate recommendations using user data, prediction, and optional check-in answers.
  // If checkinAnswers contains a field, it overrides the corresponding userData value for generation only.
  const generateRecommendations = (userDoc, predictionDoc, checkinAnswers) => {
    // Create a merged user view that prioritizes check-in answers for relevant keys
    const mergedUser = { ...(userDoc || {}) };
    if (checkinAnswers && typeof checkinAnswers === "object") {
      // Only copy keys that are relevant and non-null
      Object.keys(checkinAnswers).forEach((k) => {
        if (checkinAnswers[k] !== undefined && checkinAnswers[k] !== null) {
          mergedUser[k] = checkinAnswers[k];
        }
      });
    }

    // For logging and transparency, output the final data used for generation
    console.log("Final data used for recommendation generation:", {
      userPriorAssessment: userDoc,
      latestPrediction: predictionDoc,
      latestCheckinAnswers: checkinAnswers,
      mergedUser
    });

    const recs = {
      sleep: [],
      activity: [],
      nutrition: [],
      hydration: [],
      stress: [],
      fitnessGoal: [],
      overall: []
    };

    const u = mergedUser || {};
    const p = predictionDoc || {};

    // Sleep - prefer check-in-merged user sleepDuration or prediction's Sleep Duration
    const sleepDurationRaw = u.sleepDuration ?? p["Sleep Duration"] ?? p["sleepDuration"] ?? null;
    let sleepHours = null;
    if (sleepDurationRaw != null) {
      if (typeof sleepDurationRaw === "number") {
        sleepHours = sleepDurationRaw;
      } else {
        const m = String(sleepDurationRaw).match(/(\d+(\.\d+)?)/);
        if (m) sleepHours = parseFloat(m[1]);
      }
    }

    if (sleepHours == null) {
      recs.sleep.push({
        category: "sleep",
        issue: "unknown_sleep_duration",
        message: "We don't have a clear sleep duration recorded. Consider tracking your nightly sleep to get tailored advice."
      });
    } else if (sleepHours < 7) {
      recs.sleep.push({
        category: "sleep",
        issue: "short_sleep",
        target: 7,
        message: `Your current sleep duration is ${sleepHours} hours. Aim to gradually reach 7–8 hours per night by keeping a consistent bedtime and wind-down routine.`
      });
    } else {
      recs.sleep.push({
        category: "sleep",
        issue: "adequate_sleep",
        message: `Your current sleep duration is ${sleepHours} hours — that's within the recommended range. Keep a consistent sleep schedule to maintain sleep quality.`
      });
    }

    const sleepDisorderDetected = detectSleepDisorder(p);
    if (sleepDisorderDetected) {
      recs.sleep.push({
        category: "sleep",
        issue: "predicted_sleep_disorder",
        message:
          "The latest ML screening indicates a possible sleep-related issue. This is an automated screening result, not a medical diagnosis. Please consult a qualified healthcare professional for evaluation and guidance."
      });
    }

    // Activity - daily steps and exercise days
    const dailyStepsRaw = u.dailySteps ?? p["Daily Steps"] ?? p.dailySteps ?? null;
    const ds = parseDailySteps(dailyStepsRaw);

    const goal = (u.fitnessGoal || "").toString();

    if (ds.kind === "not_tracked" || ds.kind === "unknown") {
      recs.activity.push({
        category: "activity",
        issue: "steps_not_tracked",
        message: "Daily steps aren't tracked. If possible, enable step tracking or estimate your typical daily steps to get personalized targets."
      });
    } else if (ds.kind === "number") {
      const value = ds.value;
      if (value < 5000) {
        const target = Math.min(7000, Math.max(5000, Math.round(value + 2000)));
        recs.activity.push({
          category: "activity",
          issue: "low_steps",
          target,
          message: `Your current average is about ${value} steps/day. Gradually increase toward ${target}+ steps per day by adding short walks and step goals.`
        });
      } else if (value >= 5000 && value <= 8000) {
        if (goal.toLowerCase().includes("loss")) {
          recs.activity.push({
            category: "activity",
            issue: "moderate_steps_increase_for_weight_loss",
            target: 8000,
            message: `You average around ${value} steps/day. To support weight loss goals, gradually aim for 7,000–8,000+ steps/day while combining with strength training.`
          });
        } else {
          recs.activity.push({
            category: "activity",
            issue: "maintain_steps",
            message: `You average around ${value} steps/day. Maintain or slowly increase activity depending on your goals.`
          });
        }
      } else {
        recs.activity.push({
          category: "activity",
          issue: "good_steps",
          message: `Great work — ${value} steps/day indicates strong daily activity. Keep it up and consider targeted workouts to complement steps.`
        });
      }
    } else if (ds.kind === "range") {
      const min = ds.min ?? 0;
      const max = ds.max ?? (ds.min ? ds.min : 0);
      const avg = (min && max) ? Math.round((min + max) / 2) : (min || max || null);
      if (avg != null) {
        if (avg < 5000) {
          recs.activity.push({
            category: "activity",
            issue: "low_steps_range",
            target: 7000,
            message: `Your reported steps (${min ?? "?"}-${max ?? "?"}) are on the lower side. Gradually target ~7000+ steps/day to improve activity.`
          });
        } else if (avg <= 8000) {
          recs.activity.push({
            category: "activity",
            issue: "moderate_steps_range",
            message: `Your reported steps (${min}-${max}) are moderate. Keep it consistent and increase if needed for your goal.`
          });
        } else {
          recs.activity.push({
            category: "activity",
            issue: "high_steps_range",
            message: `Your reported steps (${min}-${max}) look good. Consider focused training based on your fitness goal.`
          });
        }
      } else {
        recs.activity.push({
          category: "activity",
          issue: "steps_unclear",
          message: `We couldn't parse your steps precisely. Consider tracking steps for clearer recommendations.`
        });
      }
    }

    // Exercise frequency and workout duration
    const exerciseDaysRaw = u.exerciseDays ?? null;
    const exerciseDaysNum = parseExerciseDays(exerciseDaysRaw);
    const workoutDuration = (u.workoutDuration || "").toString().toLowerCase();

    if (exerciseDaysNum == null) {
      recs.activity.push({
        category: "activity",
        issue: "exercise_unknown",
        message: "Exercise frequency isn't clear. Try to record your typical weekly exercise days and average session duration."
      });
    } else if (exerciseDaysNum < 2) {
      recs.activity.push({
        category: "activity",
        issue: "low_exercise_frequency",
        message: "Your exercise frequency is low. Start with short, 10–20 minute sessions 2–3 times/week and build up gradually."
      });
    } else {
      recs.activity.push({
        category: "activity",
        issue: "exercise_consistent",
        message: `You exercise about ${exerciseDaysRaw}. Keep that up — combine cardio and resistance work tailored to your goal (${goal || "general fitness"}).`
      });
    }

    if (workoutDuration.includes("no") || workoutDuration.includes("no workout")) {
      recs.activity.push({
        category: "activity",
        issue: "no_workout",
        message: "You indicated no formal workouts. Consider short resistance workouts or brisk walks to build fitness and support metabolism."
      });
    } else if (workoutDuration.includes("less than 30")) {
      recs.activity.push({
        category: "activity",
        issue: "short_workout",
        message: "Short workouts are a great start. If your goal needs more stimulus (e.g., muscle gain), gradually extend sessions to 30–45 minutes and include strength work."
      });
    }

    // Hydration
    const water = parseWaterIntake(u.waterIntake);
    if (water == null) {
      recs.hydration.push({
        category: "hydration",
        issue: "unknown_hydration",
        message: "We don't have a clear water intake recorded. Aim for ~2 litres/day as a general target; adjust for activity and climate."
      });
    } else if (water < 1.5) {
      recs.hydration.push({
        category: "hydration",
        issue: "low_hydration",
        target: 2000,
        message: `Your reported intake (~${water} L) is on the low side. Aim to increase to around 1.5–2+ litres daily, more when active.`
      });
    } else {
      recs.hydration.push({
        category: "hydration",
        issue: "adequate_hydration",
        message: `Your reported intake (~${water} L) is reasonable. Continue to hydrate, especially around workouts.`
      });
    }

    // Stress & Wellbeing
    const stressRaw = u.stressLevel ?? p["Stress Level"] ?? null;
    const stressNum = numericLevel(stressRaw);
    if (stressNum == null) {
      recs.stress.push({
        category: "stress",
        issue: "unknown_stress",
        message: "Stress level is not clearly recorded. Consider self-rating stress daily to enable tailored strategies."
      });
    } else if (stressNum >= 4) {
      recs.stress.push({
        category: "stress",
        issue: "high_stress",
        message: "Your stress level appears elevated. Try short daily relaxation practices (breathing, 5–10 min mindfulness) and consider professional support if persistent."
      });
    } else {
      recs.stress.push({
        category: "stress",
        issue: "controlled_stress",
        message: "Your stress level looks relatively controlled. Keep up stress-management habits and monitor regularly."
      });
    }

    // Energy
    const energyRaw = u.energyLevel ?? null;
    const energyNum = numericLevel(energyRaw);
    if (energyNum == null) {
      recs.overall.push({
        category: "energy",
        issue: "unknown_energy",
        message: "Energy level not provided. Recording it daily can help identify patterns related to sleep, nutrition, or training load."
      });
    } else if (energyNum <= 2) {
      recs.overall.push({
        category: "energy",
        issue: "low_energy",
        message: "Your energy is low. Evaluate sleep, nutrition, and stress — small improvements in those areas often improve daily energy."
      });
    } else {
      recs.overall.push({
        category: "energy",
        issue: "adequate_energy",
        message: "Energy level looks acceptable. Monitor trends relative to training and recovery to avoid overtraining."
      });
    }

    // Nutrition
    const diet = (u.dietPreference || "").toString();
    const junk = (u.junkFoodFrequency || "").toString().toLowerCase();
    const protein = (u.proteinIntake || "").toString().toLowerCase();
    const meals = (u.mealsPerDay || "").toString();

    if (junk.includes("daily") || junk.includes("3-4") || junk.includes("3-4 times")) {
      recs.nutrition.push({
        category: "nutrition",
        issue: "high_junk_food",
        message: "High frequency of junk food can hinder goals. Aim to reduce processed snacks and prioritize whole-food meals 4–5 days a week."
      });
    } else if (junk.includes("1-2") || junk.includes("never")) {
      recs.nutrition.push({
        category: "nutrition",
        issue: "junk_food_ok",
        message: "Your junk food intake is moderate/low. Continue focusing on nutrient-dense meals."
      });
    } else {
      recs.nutrition.push({
        category: "nutrition",
        issue: "junk_food_unknown",
        message: "If possible, provide more detail on junk food frequency to tailor nutrition advice."
      });
    }

    if (protein.includes("low") || protein.includes("not sure")) {
      const targetProtein = goal.toLowerCase().includes("gain") ? 1.6 : 1.2;
      recs.nutrition.push({
        category: "nutrition",
        issue: "low_protein",
        target: targetProtein,
        message: "Protein intake appears low or uncertain. Ensure adequate protein per meal, especially around resistance training to support muscle and recovery."
      });
    } else {
      recs.nutrition.push({
        category: "nutrition",
        issue: "protein_ok",
        message: "Protein intake seems adequate or reported as moderate/high. Keep distributing protein across meals."
      });
    }

    if (meals && (meals.toLowerCase().includes("1") || meals === "1")) {
      recs.nutrition.push({
        category: "nutrition",
        issue: "low_meals_per_day",
        message: "If you eat very few meals daily, ensure each meal is balanced and consider adding snacks to meet energy and protein needs for your goal."
      });
    }

    // Fitness Goal - tailored suggestions
    const goalLc = (goal || "").toLowerCase();
    if (goalLc.includes("loss")) {
      recs.fitnessGoal.push({
        category: "fitnessGoal",
        issue: "weight_loss",
        message: "For weight loss: combine a moderate calorie deficit with consistent activity (steps + 2–3 weekly strength sessions). Focus on protein and sleep for recovery."
      });
    } else if (goalLc.includes("gain")) {
      recs.fitnessGoal.push({
        category: "fitnessGoal",
        issue: "weight_gain",
        message: "For weight gain: prioritize progressive resistance training and slightly increase calorie and protein intake across meals to support muscle growth."
      });
    } else if (goalLc.includes("maintain")) {
      recs.fitnessGoal.push({
        category: "fitnessGoal",
        issue: "maintain_fitness",
        message: "To maintain fitness: balance regular activity with recovery, track key metrics, and adjust training variety to keep progressing safely."
      });
    } else {
      recs.fitnessGoal.push({
        category: "fitnessGoal",
        issue: "no_goal",
        message: "You haven't set a clear fitness goal. Defining a clear goal (e.g., lose weight, gain muscle, maintain fitness) helps tailor recommendations."
      });
    }

    // Routine consistency
    const consistency = (u.routineConsistency || "").toString();
    const consistencyNum = parseInt(consistency, 10);
    if (!isNaN(consistencyNum)) {
      if (consistencyNum <= 2) {
        recs.overall.push({
          category: "routine",
          issue: "low_consistency",
          message: "Routine consistency is low. Start with small, repeatable habits (anchor them to existing daily events) to build momentum."
        });
      } else {
        recs.overall.push({
          category: "routine",
          issue: "routine_ok",
          message: "Your routine consistency looks decent. Continue building predictable habits and track adherence weekly."
        });
      }
    } else if (consistency.toLowerCase().includes("not")) {
      recs.overall.push({
        category: "routine",
        issue: "not_consistent",
        message: "Your routine consistency is low. Focus on small wins and set simple targets you can sustain for multiple weeks."
      });
    }

    // Sitting Hours
    const sitting = (u.sittingHours || "").toString().toLowerCase();
    if (sitting.includes("more than 9")) {
      recs.overall.push({
        category: "sitting",
        issue: "high_sitting",
        message: "Prolonged sitting is high. Introduce standing breaks, 5-minute movement breaks each hour, and short walks to reduce sedentary time."
      });
    } else if (sitting.includes("6-9")) {
      recs.overall.push({
        category: "sitting",
        issue: "moderate_sitting",
        message: "Sitting time is moderate. Try hourly micro-breaks and a short walk post-lunch to reduce prolonged sitting."
      });
    } else {
      recs.overall.push({
        category: "sitting",
        issue: "low_sitting",
        message: "Sitting time looks reasonable. Keep integrating movement throughout the day."
      });
    }

    // Final overall suggestions/focus areas
    const actionable = [];
    ["sleep", "activity", "nutrition", "hydration", "stress", "fitnessGoal", "overall"].forEach((cat) => {
      const items = recs[cat];
      if (!items) return;
      items.forEach((it) => {
        if (it.issue && /short|low|high|unknown|not|no_|predicted|high_junk|low_protein|low_energy|low_consistency|high_sitting/i.test(it.issue)) {
          actionable.push(it);
        }
      });
    });

    if (actionable.length > 0) {
      recs.overall.unshift({
        category: "overall",
        issue: "top_actions",
        message: "Top recommended actions:",
        targets: actionable.slice(0, 4)
      });
    } else {
      recs.overall.unshift({
        category: "overall",
        issue: "all_good",
        message: "Many metrics look good. Keep the routine and periodically re-assess to continue improving."
      });
    }

    // Log generated recommendations for verification
    console.log("Generated recommendations:", recs);

    return recs;
  };

  // Load current user, latest prediction, latest check-in, and generate recommendations
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("No authenticated user found. Please sign in.");
          setLoading(false);
          return;
        }
        const currentUid = currentUser.uid;
        if (!mounted) return;
        setUid(currentUid);

        // Read user doc
        const userRef = doc(db, "users", currentUid);
        const userSnap = await getDoc(userRef);
        const userDocData = userSnap.exists() ? userSnap.data() : {};
        if (!mounted) return;
        setUserData(userDocData || {});

        // Read latest prediction
        const predictionsCol = collection(db, "users", currentUid, "predictions");
        const qPred = query(predictionsCol, orderBy("createdAt", "desc"), limit(1));
        const qPredSnap = await getDocs(qPred);
        let latestPred = null;
        let predictionId = null;
        if (!qPredSnap.empty) {
          const docSnap = qPredSnap.docs[0];
          latestPred = docSnap.data();
          predictionId = docSnap.id;
        } else {
          const qAny = query(predictionsCol, limit(1));
          const qAnySnap = await getDocs(qAny);
          if (!qAnySnap.empty) {
            latestPred = qAnySnap.docs[0].data();
            predictionId = qAnySnap.docs[0].id;
          }
        }
        if (!mounted) return;
        setLatestPrediction(latestPred);
        console.log("Latest prediction:", latestPred);

        // Read latest check-in (follow-up)
        const checkInsCol = collection(db, "users", currentUid, "checkIns");
        const qCheck = query(checkInsCol, orderBy("createdAt", "desc"), limit(1));
        const qCheckSnap = await getDocs(qCheck);
        let latestChk = null;
        if (!qCheckSnap.empty) {
          const docSnap = qCheckSnap.docs[0];
          latestChk = docSnap.data();
          latestChk.id = docSnap.id;
        }
        if (!mounted) return;
        setLatestCheckin(latestChk);
        console.log("Latest check-in:", latestChk);
        console.log("Check-in answers:", latestChk?.answers);

        // Generate recommendations using merged data (check-in answers override user fields)
        const recs = generateRecommendations(userDocData || {}, latestPred || {}, latestChk?.answers || null);
        if (!mounted) return;
        setRecommendations(recs);

        // Save recommendations to user's document and into latest prediction doc if available
        try {
          const userWrite = {
            currentRecommendations: recs,
            recommendationsUpdatedAt: serverTimestamp()
          };
          await setDoc(userRef, userWrite, { merge: true });

          if (predictionId) {
            const predRef = doc(db, "users", currentUid, "predictions", predictionId);
            await setDoc(predRef, { recommendations: recs }, { merge: true });
          }

          setSavedAt(new Date());
        } catch (saveErr) {
          console.error("Error saving recommendations:", saveErr);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Failed loading data. See console for details.");
        setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, []);

  // Allow manual regeneration; include latest check-in in regeneration
  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!uid) {
        setError("No authenticated user found.");
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const userDocData = userSnap.exists() ? userSnap.data() : {};
      setUserData(userDocData || {});

      const predictionsCol = collection(db, "users", uid, "predictions");
      const qPred = query(predictionsCol, orderBy("createdAt", "desc"), limit(1));
      const qPredSnap = await getDocs(qPred);
      let latestPred = null;
      let predictionId = null;
      if (!qPredSnap.empty) {
        const docSnap = qPredSnap.docs[0];
        latestPred = docSnap.data();
        predictionId = docSnap.id;
      }
      setLatestPrediction(latestPred);
      console.log("Latest prediction (regenerate):", latestPred);

      const checkInsCol = collection(db, "users", uid, "checkIns");
      const qCheck = query(checkInsCol, orderBy("createdAt", "desc"), limit(1));
      const qCheckSnap = await getDocs(qCheck);
      let latestChk = null;
      if (!qCheckSnap.empty) {
        const docSnap = qCheckSnap.docs[0];
        latestChk = docSnap.data();
        latestChk.id = docSnap.id;
      }
      setLatestCheckin(latestChk);
      console.log("Latest check-in (regenerate):", latestChk);
      console.log("Check-in answers (regenerate):", latestChk?.answers);

      const recs = generateRecommendations(userDocData || {}, latestPred || {}, latestChk?.answers || null);
      setRecommendations(recs);

      await setDoc(userRef, { currentRecommendations: recs, recommendationsUpdatedAt: serverTimestamp() }, { merge: true });
      if (predictionId) {
        const predRef = doc(db, "users", uid, "predictions", predictionId);
        await setDoc(predRef, { recommendations: recs }, { merge: true });
      }
      setSavedAt(new Date());
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to regenerate recommendations.");
      setLoading(false);
    }
  };

  // Small helper to display an item succinctly
  const renderItem = (it) => {
    if (!it) return null;
    const hasTarget = it.target != null;
    return (
      <div className="rec-item" key={`${it.issue}-${Math.random().toString(36).substr(2, 6)}`}>
        <div className="rec-header">
          <span className="rec-bullet">{/low|short|high|predicted|unknown|no_/.test(it.issue) ? "⚠" : "✓"}</span>
          <div className="rec-title">
            <div className="rec-category">{it.category}</div>
            <div className="rec-message">{it.message}</div>
          </div>
        </div>
        {hasTarget ? <div className="rec-target">Target: {it.target}</div> : null}
      </div>
    );
  };

  return (
    <div className="recommendations-wrapper">
      <header className="recommendations-header">
        <h2>Personalized Recommendations</h2>
        <p className="muted">Based on your latest assessment, ML screening, and most recent follow-up check-in.</p>
      </header>

      {loading && (
        <div className="state-info">
          <p>Loading recommendations…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="recommendations-meta">
            <div>
              <strong>Personalized for:</strong> {userData?.fullName ?? "You"}
            </div>
            <div>
              <strong>Based on:</strong>{" "}
              {latestPrediction && latestPrediction.createdAt
                ? "latest prediction"
                : latestPrediction
                ? "latest prediction (timestamp unknown)"
                : "user profile only"}
              {latestCheckin ? " + latest check-in" : ""}
            </div>
            <div className="actions">
              <button className="regen-btn" onClick={handleRegenerate}>
                Regenerate
              </button>
            </div>
          </div>

          <main className="recommendations-grid">
            {recommendations?.sleep?.length > 0 && (
              <section className="rec-section">
                <h3>Sleep</h3>
                <div className="rec-list">
                  {recommendations.sleep.map((it) => renderItem(it))}
                </div>
              </section>
            )}

            {recommendations?.activity?.length > 0 && (
              <section className="rec-section">
                <h3>Physical Activity</h3>
                <div className="rec-list">{recommendations.activity.map((it) => renderItem(it))}</div>
              </section>
            )}

            {recommendations?.nutrition?.length > 0 && (
              <section className="rec-section">
                <h3>Nutrition</h3>
                <div className="rec-list">{recommendations.nutrition.map((it) => renderItem(it))}</div>
              </section>
            )}

            {recommendations?.hydration?.length > 0 && (
              <section className="rec-section">
                <h3>Hydration</h3>
                <div className="rec-list">{recommendations.hydration.map((it) => renderItem(it))}</div>
              </section>
            )}

            {recommendations?.stress?.length > 0 && (
              <section className="rec-section">
                <h3>Stress & Wellbeing</h3>
                <div className="rec-list">{recommendations.stress.map((it) => renderItem(it))}</div>
              </section>
            )}

            {recommendations?.fitnessGoal?.length > 0 && (
              <section className="rec-section">
                <h3>Fitness Goal</h3>
                <div className="rec-list">{recommendations.fitnessGoal.map((it) => renderItem(it))}</div>
              </section>
            )}

            {recommendations?.overall?.length > 0 && (
              <section className="rec-section">
                <h3>Overall Progress</h3>
                <div className="rec-list">{recommendations.overall.map((it) => renderItem(it))}</div>
              </section>
            )}
          </main>

          <footer className="recommendation-footer">
            {savedAt ? (
              <div className="saved-note">Recommendations saved to your profile ({savedAt.toLocaleString()})</div>
            ) : (
              <div className="saved-note">Recommendations not yet saved or saving failed — check console.</div>
            )}
            <div className="disclaimer">
              <small>
                Note: ML screening results are not medical diagnoses. If a sleep disorder is suspected, please consult a qualified healthcare professional.
              </small>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Recommendations;