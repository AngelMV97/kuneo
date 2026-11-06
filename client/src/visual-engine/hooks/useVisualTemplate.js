import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { getMockTemplate } from "../utils/mockTemplates";

/**
 * Hook para cargar visual_template desde Supabase
 * Fallback a datos mockeados en desarrollo si la BD está vacía
 * @param {string} templateKey - template_key del visual
 * @returns {object} { template, loading, error }
 */
export function useVisualTemplate(templateKey) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(Boolean(templateKey));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateKey) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .schema("kuneo")
          .from("visual_templates")
          .select("*")
          .eq("template_key", templateKey);

        if (supabaseError) {
          throw new Error(`No se pudo cargar la plantilla visual: ${supabaseError.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error(`Plantilla visual no encontrada: ${templateKey}`);
        }

        // Si hay múltiples, tomar el primero
        setTemplate(data[0]);
      } catch (err) {
        console.error("[useVisualTemplate] Error:", err);
        setError(err.message);
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [templateKey]);

  return { template, loading, error };
}
