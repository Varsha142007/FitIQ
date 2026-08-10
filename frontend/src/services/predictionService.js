const API_URL = "http://127.0.0.1:5000";

/*
==========================================================
Sleep Disorder Prediction
==========================================================
*/
export const predictSleepDisorder = async (predictionData) => {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictionData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.details ||
        result.error ||
        "Sleep disorder prediction failed"
      );
    }

    return result;
  } catch (error) {
    console.error("Sleep prediction error:", error);
    throw error;
  }
};


/*
==========================================================
Calories Prediction
==========================================================
*/
export const predictCalories = async (caloriesData) => {
  try {
    const response = await fetch(`${API_URL}/predict-calories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(caloriesData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.details ||
        result.error ||
        "Calories prediction failed"
      );
    }

    return result;
  } catch (error) {
    console.error("Calories prediction error:", error);
    throw error;
  }
};