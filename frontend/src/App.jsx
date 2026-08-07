import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import InitialAssessment from "./components/InitialAssessment";
import SleepPrediction from "./components/SleepPrediction";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/assessment" element={<InitialAssessment />} />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* Keep this for now, but it is not the main flow */}
        <Route path="/predict" element={<SleepPrediction />} />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
