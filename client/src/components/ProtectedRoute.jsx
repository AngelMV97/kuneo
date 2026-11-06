import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ children, allowedRole }) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Auth check failed:", userError);
                    navigate("/");
                    return;
                }

                // If no allowedRole specified, allow any authenticated user
                if (!allowedRole) {
                    setAuthorized(true);
                    setLoading(false);
                    return;
                }

                // Check profile using RPC function
                const { data: profile, error: profileError } = await supabase
                    .rpc('kuneo_get_user_profile', { p_user_id: user.id });

                if (profileError) {
                    console.error("Profile fetch error:", profileError);
                    navigate("/");
                    return;
                }

                // Extract profile object from array (RPC returns array)
                const profileObject = Array.isArray(profile) && profile.length > 0 ? profile[0] : profile;

                // ✅ If profile doesn't exist, redirect to character selection
                if (!profileObject) {
                    console.warn("Profile not found, redirecting to character selection...");
                    navigate("/character-selection");
                    return;
                } else {
                    // Profile exists, allow access
                    // For student-only routes, everyone is a student in Kuneo
                    setAuthorized(true);
                }

                setLoading(false);
            } catch (err) {
                console.error("ProtectedRoute error:", err);
                navigate("/");
            }
        }

        checkAuth();
    }, [allowedRole, navigate]);

    if (loading) return <p style={{ padding: "2rem" }}>Cargando...</p>;

    return authorized ? children : null;
}

export default ProtectedRoute;