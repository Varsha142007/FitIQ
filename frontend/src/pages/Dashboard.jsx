// src/pages/Dashboard.jsx

import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  Link
} from "react-router-dom";

import {
  auth,
  db
} from "../firebase/firebase";

import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";

import {
  signOut
} from "firebase/auth";

import "./Dashboard.css";


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

import {
  Line
} from "react-chartjs-2";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const Dashboard = () => {

  const navigate =
    useNavigate();


  // ========================================================
  // STATE
  // ========================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [userDoc, setUserDoc] =
    useState(null);

  const [predictions, setPredictions] =
    useState([]);

  const [checkIns, setCheckIns] =
    useState([]);

  const [latestRecommendation, setLatestRecommendation] =
    useState(null);

  const [bmi, setBmi] =
    useState(null);

  const [caloriesEstimate, setCaloriesEstimate] =
    useState(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [modalDismissed, setModalDismissed] =
    useState(false);


  // ========================================================
  // LOAD DASHBOARD
  // ========================================================

  useEffect(() => {

    let mounted = true;


    const loadDashboardData =
      async () => {

        setLoading(true);
        setError(null);


        try {

          const currentUser =
            auth.currentUser;


          if (!currentUser) {

            navigate("/login");

            return;
          }


          const uid =
            currentUser.uid;


          // ------------------------------------------------
          // USER DOCUMENT
          // ------------------------------------------------

          const userRef =
            doc(
              db,
              "users",
              uid
            );


          const userSnap =
            await getDoc(
              userRef
            );


          const userData =
            userSnap.exists()
              ? userSnap.data()
              : null;


          if (!mounted) return;


          setUserDoc(
            userData
          );


          setLatestRecommendation(
            userData?.currentRecommendations ??
            null
          );


          // ------------------------------------------------
          // PREDICTIONS
          // ------------------------------------------------

          try {

            const predsRef =
              collection(
                db,
                "users",
                uid,
                "predictions"
              );


            const predictionsQuery =
              query(
                predsRef,
                orderBy(
                  "createdAt",
                  "desc"
                ),
                limit(20)
              );


            const snap =
              await getDocs(
                predictionsQuery
              );


            const items =
              snap.docs.map(
                d => ({
                  id: d.id,
                  ...d.data()
                })
              );


            if (!mounted) return;


            setPredictions(
              items
            );


            // --------------------------------------------
            // FIND LATEST CALORIE RESULT
            // --------------------------------------------

            /*
              Your InitialAssessment saves calories as:

              caloriesBurned
              latestCalories

              and history also contains:

              caloriesBurned
              calories

              So we check ALL of these.
            */

            const caloriePrediction =
              items.find(
                item =>
                  item.caloriesBurned != null ||
                  item.calories != null
              );


            if (
              caloriePrediction
            ) {

              const calorieValue =
                caloriePrediction.caloriesBurned != null
                  ? caloriePrediction.caloriesBurned
                  : caloriePrediction.calories;


              const parsedCalories =
                Number(
                  calorieValue
                );


              if (
                Number.isFinite(
                  parsedCalories
                )
              ) {

                setCaloriesEstimate(
                  parsedCalories
                );

              } else {

                setCaloriesEstimate(
                  null
                );

              }

            } else if (
              userData?.caloriesBurned != null
            ) {

              setCaloriesEstimate(
                Number(
                  userData.caloriesBurned
                )
              );

            } else if (
              userData?.latestCalories != null
            ) {

              setCaloriesEstimate(
                Number(
                  userData.latestCalories
                )
              );

            } else {

              setCaloriesEstimate(
                null
              );

            }


          } catch (err) {

            console.error(
              "Failed to load predictions:",
              err
            );


            /*
              Even if prediction history fails,
              use the latest value stored directly
              in the user document.
            */

            if (
              userData?.caloriesBurned != null
            ) {

              setCaloriesEstimate(
                Number(
                  userData.caloriesBurned
                )
              );

            } else if (
              userData?.latestCalories != null
            ) {

              setCaloriesEstimate(
                Number(
                  userData.latestCalories
                )
              );

            }

          }


          // ------------------------------------------------
          // CHECK-INS
          // ------------------------------------------------

          try {

            const checksRef =
              collection(
                db,
                "users",
                uid,
                "checkIns"
              );


            const checksQuery =
              query(
                checksRef,
                orderBy(
                  "createdAt",
                  "desc"
                ),
                limit(14)
              );


            const snap =
              await getDocs(
                checksQuery
              );


            let checks =
              snap.docs.map(
                d => ({
                  id: d.id,
                  ...d.data()
                })
              );


            checks =
              checks.reverse();


            if (!mounted) return;


            setCheckIns(
              checks
            );


            // ==================================================
            // CHECK-IN POPUP LOGIC
            // ==================================================

            /*
              When InitialAssessment redirects to Dashboard,
              it creates this temporary localStorage flag.

              Therefore:

              First assessment
                    ↓
              Dashboard
                    ↓
              NO popup

              User logs out
                    ↓
              User logs in again
                    ↓
              popup appears if there is no check-in today.
            */

            const justCompletedAssessment =
              localStorage.getItem(
                "fitiq_initial_assessment_completed"
              );


            if (
              justCompletedAssessment ===
              "true"
            ) {

              // Consume the flag.
              // It will not exist on the next login.

              localStorage.removeItem(
                "fitiq_initial_assessment_completed"
              );


              setModalVisible(
                false
              );

            } else if (
              !modalDismissed
            ) {

              const show =
                shouldShowCheckinModal(
                  checks,
                  userData
                );


              setModalVisible(
                show
              );

            }


          } catch (err) {

            console.error(
              "Failed to load check-ins:",
              err
            );


            /*
              If the check-in collection does not
              exist yet, use the assessment status.

              We DON'T show the popup immediately
              after the initial assessment.
            */

            const justCompletedAssessment =
              localStorage.getItem(
                "fitiq_initial_assessment_completed"
              );


            if (
              justCompletedAssessment ===
              "true"
            ) {

              localStorage.removeItem(
                "fitiq_initial_assessment_completed"
              );

              setModalVisible(
                false
              );

            } else if (
              userData?.assessmentCompleted &&
              !modalDismissed
            ) {

              setModalVisible(
                true
              );

            }

          }


          // ------------------------------------------------
          // BMI
          // ------------------------------------------------

          try {

            const heightCm =
              userData?.height
                ? Number(
                    userData.height
                  )
                : null;


            const weightKg =
              userData?.weight
                ? Number(
                    userData.weight
                  )
                : null;


            if (
              heightCm &&
              weightKg
            ) {

              const heightM =
                heightCm / 100;


              const calcBmi =
                +(
                  weightKg /
                  (
                    heightM *
                    heightM
                  )
                ).toFixed(1);


              setBmi(
                calcBmi
              );

            } else if (
              userData?.bmi != null
            ) {

              setBmi(
                Number(
                  userData.bmi
                )
              );

            } else {

              setBmi(
                null
              );

            }


          } catch (err) {

            console.error(
              "BMI error:",
              err
            );

          }


          if (mounted) {

            setLoading(
              false
            );

          }


        } catch (err) {

          console.error(
            "Dashboard error:",
            err
          );


          if (!mounted) return;


          setError(
            "Failed to load dashboard data."
          );


          setLoading(
            false
          );

        }

      };


    loadDashboardData();


    return () => {

      mounted = false;

    };

  }, [
    navigate,
    modalDismissed
  ]);


  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout =
    async () => {

      try {

        await signOut(
          auth
        );

        navigate(
          "/login"
        );

      } catch (err) {

        console.error(
          "Logout failed:",
          err
        );

        setError(
          "Logout failed."
        );

      }

    };


  // ========================================================
  // CHECK-IN MODAL
  // ========================================================

  const shouldShowCheckinModal =
    (checks, userData) => {

      /*
        If the user has never completed the
        initial assessment, don't show the
        follow-up check-in popup.
      */

      if (
        !userData?.assessmentCompleted
      ) {

        return false;

      }


      /*
        No follow-up check-ins yet.

        If the initial assessment was completed
        previously and the user is logging in again,
        show the popup.
      */

      if (
        !checks ||
        checks.length === 0
      ) {

        return true;

      }


      const latest =
        checks[
          checks.length - 1
        ];


      if (
        !latest ||
        !latest.createdAt
      ) {

        return true;

      }


      try {

        const date =
          typeof latest.createdAt.toDate ===
          "function"

            ? latest.createdAt.toDate()

            : new Date(
                latest.createdAt
              );


        const today =
          new Date();


        const sameDay =
          date.getFullYear() ===
            today.getFullYear() &&

          date.getMonth() ===
            today.getMonth() &&

          date.getDate() ===
            today.getDate();


        /*
          Check-in completed today
                ↓
          NO popup

          Check-in not completed today
                ↓
          SHOW popup
        */

        return !sameDay;


      } catch (e) {

        console.error(
          "Check-in date error:",
          e
        );

        return true;

      }

    };


  const onStartCheckIn =
    () => {

      setModalVisible(
        false
      );

      navigate(
        "/follow-up"
      );

    };


  const onMaybeLater =
    () => {

      setModalDismissed(
        true
      );

      setModalVisible(
        false
      );

    };


  // ========================================================
  // CHART HELPERS
  // ========================================================

  const parseSteps =
    (raw) => {

      if (raw == null)
        return null;


      if (
        typeof raw ===
        "number"
      ) {

        return raw;

      }


      const s =
        String(raw)
          .toLowerCase()
          .trim();


      if (
        s.includes("not")
      ) {

        return null;

      }


      if (
        s.includes("-") ||
        s.includes("–")
      ) {

        const p =
          s
            .split(/[-–]/)
            .map(
              x =>
                x.replace(
                  /[^\d]/g,
                  ""
                )
            );


        if (
          p.length === 2
        ) {

          return Math.round(
            (
              Number(p[0]) +
              Number(p[1])
            ) / 2
          );

        }

      }


      const m =
        s.match(
          /(\d{3,})/
        );


      return m
        ? parseInt(
            m[1],
            10
          )
        : null;

    };


  const parseSleep =
    (raw) => {

      if (raw == null)
        return null;


      if (
        typeof raw ===
        "number"
      ) {

        return raw;

      }


      const s =
        String(raw)
          .toLowerCase()
          .trim();


      if (
        s.includes("-") ||
        s.includes("–")
      ) {

        const p =
          s
            .split(/[-–]/)
            .map(
              x =>
                x.replace(
                  /[^\d.]/g,
                  ""
                )
            );


        if (
          p.length === 2
        ) {

          return (
            parseFloat(p[0]) +
            parseFloat(p[1])
          ) / 2;

        }

      }


      const m =
        s.match(
          /(\d+(\.\d+)?)/

        );


      return m
        ? parseFloat(
            m[1]
          )
        : null;

    };


  const parseCalories =
    (value) => {

      if (
        value == null
      ) {

        return null;

      }


      const number =
        Number(
          value
        );


      return Number.isFinite(
        number
      )
        ? number
        : null;

    };


  // ========================================================
  // PROGRESS CHART
  // ========================================================

  const chartData =
    useMemo(
      () => {

        if (
          !checkIns ||
          checkIns.length === 0
        ) {

          return null;

        }


        const labels = [];
        const steps = [];
        const sleep = [];
        const calories = [];


        checkIns.forEach(
          (c, idx) => {

            let label =
              `Check-in ${idx + 1}`;


            if (
              c.createdAt &&
              typeof c.createdAt.toDate ===
                "function"
            ) {

              try {

                label =
                  c.createdAt
                    .toDate()
                    .toLocaleDateString();

              } catch (e) {}

            }


            labels.push(
              label
            );


            const answers =
              c.answers ?? {};


            steps.push(
              parseSteps(
                answers.dailySteps
              )
            );


            sleep.push(
              parseSleep(
                answers.sleepDuration
              )
            );


            /*
              Support all possible calorie
              field names.
            */

            calories.push(
              parseCalories(
                c.caloriesBurned ??
                c.calories
              )
            );

          }
        );


        const datasets = [];


        const hasSteps =
          steps.filter(
            v => v != null
          ).length >= 2;


        const hasSleep =
          sleep.filter(
            v => v != null
          ).length >= 2;


        const hasCalories =
          calories.filter(
            v => v != null
          ).length >= 1;


        if (hasSteps) {

          datasets.push({

            label:
              "Daily Steps",

            data:
              steps,

            borderColor:
              "#16a34a",

            backgroundColor:
              "rgba(16,163,74,0.08)",

            tension:
              0.25,

            yAxisID:
              "ySteps",

            fill:
              true,

            spanGaps:
              true

          });

        }


        if (hasSleep) {

          datasets.push({

            label:
              "Sleep (hrs)",

            data:
              sleep,

            borderColor:
              "#0891b2",

            backgroundColor:
              "rgba(8,145,178,0.07)",

            tension:
              0.25,

            yAxisID:
              "ySleep",

            fill:
              true,

            spanGaps:
              true

          });

        }


        if (hasCalories) {

          datasets.push({

            label:
              "Calories",

            data:
              calories,

            borderColor:
              "#f97316",

            backgroundColor:
              "rgba(249,115,22,0.07)",

            tension:
              0.25,

            yAxisID:
              "yCalories",

            fill:
              false,

            spanGaps:
              true

          });

        }


        if (
          datasets.length === 0
        ) {

          return null;

        }


        return {
          labels,
          datasets
        };

      },
      [checkIns]
    );


  const chartOptions =
    useMemo(
      () => ({

        responsive:
          true,

        maintainAspectRatio:
          false,

        interaction: {
          mode:
            "index",

          intersect:
            false
        },

        plugins: {

          legend: {
            position:
              "top"
          },

          tooltip: {

            callbacks: {

              label:
                context => {

                  const label =
                    context.dataset.label ||
                    "";


                  const y =
                    context.parsed.y;


                  if (
                    context.dataset.yAxisID ===
                    "ySteps"
                  ) {

                    return `${label}: ${y ?? "—"} steps`;

                  }


                  if (
                    context.dataset.yAxisID ===
                    "ySleep"
                  ) {

                    return `${label}: ${y ?? "—"} hrs`;

                  }


                  if (
                    context.dataset.yAxisID ===
                    "yCalories"
                  ) {

                    return `${label}: ${y ?? "—"} kcal`;

                  }


                  return `${label}: ${y ?? "—"}`;

                }

            }

          }

        },


        scales: {

          x: {
            type:
              "category"
          },


          ySteps: {

            type:
              "linear",

            display:
              chartData?.datasets?.some(
                d =>
                  d.yAxisID ===
                  "ySteps"
              ) ?? false,

            position:
              "left",

            title: {
              display:
                true,

              text:
                "Steps"
            }

          },


          ySleep: {

            type:
              "linear",

            display:
              chartData?.datasets?.some(
                d =>
                  d.yAxisID ===
                  "ySleep"
              ) ?? false,

            position:
              "right",

            grid: {
              drawOnChartArea:
                false
            },

            title: {
              display:
                true,

              text:
                "Sleep (hrs)"
            }

          },


          yCalories: {

            type:
              "linear",

            display:
              chartData?.datasets?.some(
                d =>
                  d.yAxisID ===
                  "yCalories"
              ) ?? false,

            position:
              "right",

            grid: {
              drawOnChartArea:
                false
            },

            title: {
              display:
                true,

              text:
                "Calories (kcal)"
            }

          }

        }

      }),
      [chartData]
    );


  // ========================================================
  // METRIC CARD
  // ========================================================

  const MetricCard =
    ({
      label,
      value,
      unit,
      icon
    }) => (

      <div
        className="metric-card card"
      >

        <div className="metric-head">

          <div
            className="metric-icon"
            aria-hidden
            dangerouslySetInnerHTML={{
              __html:
                icon
            }}
          />

          <div className="metric-label">
            {label}
          </div>

        </div>


        <div className="metric-value">

          <div className="value">

            {value ??
              "—"}

          </div>

          <div className="unit">

            {unit ??
              ""}

          </div>

        </div>

      </div>
    );


  // ========================================================
  // HEADER
  // ========================================================

  const DashboardHeader =
    () => (

      <header
        className="di-header"
      >

        <div
          className="di-left"
        >

          <div className="logo">

            <div className="logo-text">

              <div className="title">
                FitIQ
              </div>

              <div className="tagline">
                AI-Powered Fitness & Wellness
              </div>

            </div>

          </div>


          <nav
            className="di-nav"
          >

            <Link
              to="/dashboard"
              className="nav-link active"
            >
              Home
            </Link>

            <Link
              to="/history"
              className="nav-link"
            >
              History
            </Link>

            <Link
              to="/recommendations"
              className="nav-link"
            >
              Recommendations
            </Link>

          </nav>

        </div>


        <div
          className="di-right"
        >

          <div
            className="profile-mini"
          >

            <div className="avatar">

              {userDoc?.fullName
                ? userDoc.fullName
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>


            <div className="profile-name">

              {userDoc?.fullName ??
                "User"}

            </div>


            <button
              className="btn-ghost"
              onClick={
                handleLogout
              }
            >
              Logout
            </button>

          </div>

        </div>

      </header>
    );


  // ========================================================
  // SLEEP CARD
  // ========================================================

  const SleepHealthCard =
    () => {

      const prediction =
        predictions?.find(
          p =>
            p.disorder != null
        );


      const status =
        prediction?.disorder ??
        userDoc?.disorder ??
        userDoc?.prediction ??
        "No prediction";


      return (

        <section
          className="card sleep-card"
        >

          <h3
            className="card-title"
          >
            Sleep Health
          </h3>


          <div
            className="sleep-status-row"
          >

            <div
              className="sleep-badge ok"
            >
              {status}
            </div>

            <div className="sleep-sub">
              Latest ML screening
            </div>

          </div>


          <div
            className="sleep-metrics"
          >

            <div
              className="sleep-metric"
            >

              <div className="small-label">
                Sleep Duration
              </div>

              <div className="small-value">

                {userDoc?.sleepDuration ??
                  "—"} hrs

              </div>

            </div>


            <div
              className="sleep-metric"
            >

              <div className="small-label">
                Sleep Quality
              </div>

              <div className="small-value">

                {userDoc?.qualityOfSleep ??
                  "—"}

              </div>

            </div>


            <div
              className="sleep-metric"
            >

              <div className="small-label">
                Heart Rate
              </div>

              <div className="small-value">

                {userDoc?.heartRate ??
                  "—"} BPM

              </div>

            </div>

          </div>

        </section>
      );

    };


  // ========================================================
  // RECOMMENDATIONS
  // ========================================================

  const TodaysFocus =
    () => {

      const items = [];


      const recs =
        latestRecommendation;


      if (
        recs
      ) {

        [
          "activity",
          "hydration",
          "sleep",
          "stress",
          "energy",
          "lifestyle"
        ].forEach(
          category => {

            const arr =
              recs[category];


            if (
              Array.isArray(arr)
            ) {

              arr.forEach(
                item => {

                  const text =
                    item?.message ??
                    item?.issue;


                  if (
                    text &&
                    items.length < 4
                  ) {

                    items.push(
                      text
                    );

                  }

                }
              );

            }

          }
        );

      }


      if (
        items.length === 0
      ) {

        return (

          <section
            className="card focus-card"
          >

            <h3
              className="card-title"
            >
              Today's Focus
            </h3>

            <div className="card-body">

              <div className="empty-sub">

                Complete a follow-up
                check-in to receive
                personalized actions.

              </div>

            </div>

          </section>
        );

      }


      return (

        <section
          className="card focus-card"
        >

          <h3
            className="card-title"
          >
            Today's Focus
          </h3>


          <div
            className="focus-list"
          >

            {items.map(
              (item, index) => (

                <div
                  className="focus-item"
                  key={index}
                >

                  <div
                    className="focus-icon"
                  >
                    {[
                      "🚶",
                      "💧",
                      "😴",
                      "🧘"
                    ][index]}
                  </div>


                  <div
                    className="focus-body"
                  >

                    <div
                      className="focus-text"
                    >
                      {item}
                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </section>
      );

    };


  // ========================================================
  // RECENT ACTIVITY
  // ========================================================

  const RecentActivity =
    () => {

      const timeline = [];


      if (
        checkIns.length > 0
      ) {

        const check =
          checkIns[
            checkIns.length - 1
          ];


        timeline.push({

          date:
            check.createdAt,

          label:
            "Progress check-in completed"

        });

      }


      if (
        predictions.length > 0
      ) {

        const prediction =
          predictions[0];


        timeline.push({

          date:
            prediction.createdAt,

          label:
            prediction.type ===
            "calories"

              ? "Calories prediction generated"

              : "ML prediction generated"

        });

      }


      if (
        userDoc?.assessmentCompletedAt
      ) {

        timeline.push({

          date:
            userDoc.assessmentCompletedAt,

          label:
            "Initial assessment completed"

        });

      }


      if (
        timeline.length === 0
      ) {

        return null;

      }


      const normalized =
        timeline
          .map(item => {

            let date =
              item.date;


            if (
              date &&
              typeof date.toDate ===
                "function"
            ) {

              date =
                date.toDate();

            } else if (
              !(date instanceof Date)
            ) {

              date =
                date
                  ? new Date(date)
                  : null;

            }


            return {

              ...item,

              dateObj:
                date

            };

          })
          .sort(
            (a, b) =>
              (b.dateObj?.getTime() || 0) -
              (a.dateObj?.getTime() || 0)
          )
          .slice(
            0,
            6
          );


      return (

        <section
          className="card activity-card"
        >

          <h3
            className="card-title"
          >
            Recent Activity
          </h3>


          <ul
            className="activity-list"
          >

            {normalized.map(
              (item, index) => (

                <li
                  className="activity-item"
                  key={index}
                >

                  <div
                    className="activity-dot"
                  />


                  <div
                    className="activity-content"
                  >

                    <div
                      className="activity-label"
                    >
                      {item.label}
                    </div>


                    <div
                      className="activity-time muted"
                    >

                      {item.dateObj
                        ? item.dateObj
                            .toLocaleString()
                        : "—"}

                    </div>

                  </div>

                </li>

              )
            )}

          </ul>

        </section>
      );

    };


  // ========================================================
  // METRICS
  // ========================================================

  const metrics = [

    {
      key:
        "weight",

      label:
        "Weight",

      value:
        userDoc?.weight ??
        null,

      unit:
        "kg",

      icon:
        "⚖️"
    },


    {
      key:
        "bmi",

      label:
        "BMI",

      value:
        bmi,

      unit:
        "",

      icon:
        "📊"
    },


    {
      key:
        "dailySteps",

      label:
        "Daily Steps",

      value:
        userDoc?.dailySteps ??
        null,

      unit:
        "steps",

      icon:
        "🚶"
    },


    {
      key:
        "sleepDuration",

      label:
        "Sleep",

      value:
        userDoc?.sleepDuration ??
        null,

      unit:
        "hrs",

      icon:
        "😴"
    },


    {
      key:
        "heartRate",

      label:
        "Heart Rate",

      value:
        userDoc?.heartRate ??
        null,

      unit:
        "BPM",

      icon:
        "❤️"
    },


    {
      key:
        "calories",

      label:
        "Calories Burned",

      value:
        caloriesEstimate != null
          ? Math.round(
              caloriesEstimate
            )
          : null,

      unit:
        "kcal",

      icon:
        "🔥"
    }

  ];


  // ========================================================
  // RENDER
  // ========================================================

  if (loading) {

    return (

      <div
        className="app-shell"
      >

        <div
          style={{
            padding: 40,
            textAlign:
              "center"
          }}
        >

          Loading FitIQ dashboard...

        </div>

      </div>
    );

  }


  return (

    <div
      className="app-shell"
    >

      <DashboardHeader />


      <main
        className="dashboard-content"
      >

        {error && (

          <div
            style={{
              color:
                "#c0392b",

              marginBottom:
                15
            }}
          >

            {error}

          </div>

        )}


        <section
          className="hero"
        >

          <div
            className="hero-left"
          >

            <h1
              className="greeting"
            >

              Good{" "}
              {getTimeOfDay()},
              {" "}
              {userDoc?.fullName ??
                "there"} 👋

            </h1>


            <p
              className="subtitle"
            >

              Here's your fitness
              snapshot for today.

            </p>

          </div>


          <div
            className="hero-right"
          >

            <div
              className="status-card card"
            >

              <div
                className="status-title"
              >
                Sleep Health Status
              </div>


              <div
                className="status-value"
              >

                {predictions?.find(
                  p =>
                    p.disorder != null
                )?.disorder ??

                  userDoc?.disorder ??

                  userDoc?.prediction ??

                  "No prediction yet"}

              </div>

            </div>

          </div>

        </section>


        <section
          className="main-grid"
        >

          <div
            className="left-column"
          >

            <section
              className="card"
              style={{
                marginBottom:
                  16
              }}
            >

              <h3
                className="card-title"
              >
                Latest Calorie Prediction
              </h3>


              <div
                style={{
                  fontSize:
                    32,

                  fontWeight:
                    700,

                  marginTop:
                    10
                }}
              >

                {caloriesEstimate != null
                  ? `${Math.round(
                      caloriesEstimate
                    )} kcal`

                  : "No calorie prediction yet"}

              </div>


              <p
                className="muted"
              >

                Based on your latest
                assessment or follow-up.

              </p>

            </section>


            <div
              className="metrics-grid"
            >

              {metrics.map(
                metric => (

                  <MetricCard
                    key={
                      metric.key
                    }

                    label={
                      metric.label
                    }

                    value={
                      metric.value
                    }

                    unit={
                      metric.unit
                    }

                    icon={
                      metric.icon
                    }

                  />

                )
              )}

            </div>


            <SleepHealthCard />

          </div>


          <div
            className="right-column"
          >

            <section
              className="card progress-card"
            >

              <h3
                className="card-title"
              >
                Progress Timeline
              </h3>


              <div
                className="card-body chart-body"
                style={{
                  height:
                    350
                }}
              >

                {chartData ? (

                  <Line
                    data={
                      chartData
                    }

                    options={
                      chartOptions
                    }
                  />

                ) : (

                  <div
                    className="empty-state"
                  >

                    <div
                      className="empty-title"
                    >
                      Your progress timeline
                      will appear here
                    </div>


                    <div
                      className="empty-sub"
                    >
                      Complete follow-up
                      check-ins to track
                      sleep, steps and
                      calories.
                    </div>


                    <button
                      className="btn"
                      onClick={() =>
                        navigate(
                          "/follow-up"
                        )
                      }
                    >
                      Complete Check-In
                    </button>

                  </div>

                )}

              </div>

            </section>


            <TodaysFocus />


            <RecentActivity />

          </div>

        </section>

      </main>


      {/* ==================================================
          CHECK-IN MODAL
      ================================================== */}

      {modalVisible && (

        <>

          <div
            className="modal-overlay"
            onClick={
              onMaybeLater
            }
          />


          <div
            className="checkin-modal"
            role="dialog"
            aria-modal="true"
          >

            <div
              className="checkin-modal-inner"
            >

              <h2>
                Complete Your
                Progress Check-In
              </h2>


              <p
                className="checkin-modal-text"
              >

                This quick check-in
                updates your
                recommendations,
                progress and calorie
                prediction.

              </p>


              <div
                className="checkin-modal-actions"
              >

                <button
                  className="btn primary"
                  onClick={
                    onStartCheckIn
                  }
                >
                  Start Check-In
                </button>


                <button
                  className="btn subtle"
                  onClick={
                    onMaybeLater
                  }
                >
                  Maybe Later
                </button>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );

};


// ==========================================================
// TIME
// ==========================================================

function getTimeOfDay() {

  const h =
    new Date().getHours();


  if (h < 12)
    return "morning";


  if (h < 18)
    return "afternoon";


  return "evening";

}


export default Dashboard;