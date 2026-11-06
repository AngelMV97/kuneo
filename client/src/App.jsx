import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import CharacterSelection from "./pages/CharacterSelection";
import Home from "./pages/Home";
import CourseCatalog from "./pages/CourseCatalog";
import Module from "./pages/Module";
import ProgressView from "./pages/ProgressView";
import CognitiveProfile from "./pages/CognitiveProfile";
import IcfesPrep from "./pages/IcfesPrep";
import SessionFeedback from "./pages/SessionFeedback";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CompetencySearch from "./pages/CompetencySearch";
import ProtectedRoute from "./components/ProtectedRoute";
import { VisualEngineDemo } from "./pages/VisualEngineDemo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Onboarding */}
        <Route 
          path="/character-selection" 
          element={
            <ProtectedRoute allowedRole="student">
              <CharacterSelection />
            </ProtectedRoute>
          } 
        />

        {/* Main app routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRole="student">
              <Home />
            </ProtectedRoute>
          } 
        />
        
        <Route
          path="/catalog"
          element={
            <ProtectedRoute allowedRole="student">
              <CourseCatalog />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/module/:moduleId"
          element={
            <ProtectedRoute allowedRole="student">
              <Module />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/session-feedback/:moduleId"
          element={
            <ProtectedRoute allowedRole="student">
              <SessionFeedback />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute allowedRole="student">
              <ProgressView />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/cognitive-profile"
          element={
            <ProtectedRoute allowedRole="student">
              <CognitiveProfile />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/icfes"
          element={
            <ProtectedRoute allowedRole="student">
              <IcfesPrep />
            </ProtectedRoute>
          } 
        />

        {/* ICFES Mock Test - Dynamic route for each subject */}
        <Route
          path="/icfes/:subject"
          element={
            <ProtectedRoute allowedRole="student">
              <IcfesPrep />
            </ProtectedRoute>
          } 
        />

        {/* Competency Search - Semantic search for educational competencies */}
        <Route
          path="/competencies"
          element={
            <ProtectedRoute allowedRole="student">
              <CompetencySearch />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRole="student">
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Profile route shows cognitive profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="student">
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* Visual Engine Demo - Testing page for visual templates */}
        <Route
          path="/visual-engine-demo"
          element={<VisualEngineDemo />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
// The Login component is rendered when the user accesses the root path ("/").
// The Dashboard component is rendered when the user accesses the "/dashboard" path.
// The Assistant component is rendered when the user accesses the "/assistant" path.
// The BrowserRouter component wraps the entire application to enable routing functionality.
// The Routes component contains all the Route components that define the different paths and their corresponding components.
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
// The Login component is rendered when the user accesses the root path ("/").
// The Dashboard component is rendered when the user accesses the "/dashboard" path.
// The Assistant component is rendered when the user accesses the "/assistant" path.
// The BrowserRouter component wraps the entire application to enable routing functionality.
// The Routes component contains all the Route components that define the different paths and their corresponding components.
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
// The Login component is rendered when the user accesses the root path ("/").
// The Dashboard component is rendered when the user accesses the "/dashboard" path.
// The Assistant component is rendered when the user accesses the "/assistant" path.
// The BrowserRouter component wraps the entire application to enable routing functionality.
// The Routes component contains all the Route components that define the different paths and their corresponding components.
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
// The Login component is rendered when the user accesses the root path ("/").
// The Dashboard component is rendered when the user accesses the "/dashboard" path.
// The Assistant component is rendered when the user accesses the "/assistant" path.
// The BrowserRouter component wraps the entire application to enable routing functionality.
// The Routes component contains all the Route components that define the different paths and their corresponding components.
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
// The Login component is rendered when the user accesses the root path ("/").
// The Dashboard component is rendered when the user accesses the "/dashboard" path.
// The Assistant component is rendered when the user accesses the "/assistant" path.
// The BrowserRouter component wraps the entire application to enable routing functionality.
// The Routes component contains all the Route components that define the different paths and their corresponding components.
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
// The Login component is rendered when the user accesses the root path ("/").
// The Dashboard component is rendered when the user accesses the "/dashboard" path.
// The Assistant component is rendered when the user accesses the "/assistant" path.
// The BrowserRouter component wraps the entire application to enable routing functionality.
// The Routes component contains all the Route components that define the different paths and their corresponding components.
// The App component is exported as the default export of the module, making it available for use in other parts of the application.
// The Login, Dashboard, and Assistant components are imported from their respective files.
