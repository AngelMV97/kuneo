// client/src/pages/PrivacyPolicy.jsx
import { useNavigate } from 'react-router-dom';

/**
 * PrivacyPolicy - Política de Privacidad de Kuneo
 * Adaptada para app móvil educativa con menores de edad
 * Cumple con Ley 1581 de 2012 y Ley 1098 de 2006 (Colombia)
 */
export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Información General",
      content: `Kuneo es una aplicación móvil educativa diseñada para apoyar el aprendizaje cognitivo de estudiantes colombianos mediante un sistema de tutoría inteligente adaptativa. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos la información personal de nuestros usuarios, especialmente menores de edad, en cumplimiento con:

• **Ley 1581 de 2012** (Protección de Datos Personales)
• **Ley 1098 de 2006** (Código de la Infancia y la Adolescencia)
• **Decreto 1377 de 2013** (Reglamentación de tratamiento de datos)

**Última actualización:** Abril, 2026

**Responsable del tratamiento:**
Kuneo - Tutoría Cognitiva Adaptativa
Contacto: institucional@aulanativa.com | info@gomot.academy`
    },
    {
      title: "2. Protección de Menores de Edad",
      content: `Kuneo está diseñada para ser usada por estudiantes de **6 a 18 años**. Tomamos medidas especiales para proteger la privacidad de los menores:

✓ **Consentimiento parental:** Para menores de 14 años, requerimos autorización expresa de un padre o tutor legal
✓ **Datos mínimos:** Solo recopilamos información estrictamente necesaria para el proceso educativo
✓ **Sin publicidad:** La app no muestra anuncios ni publicidad dirigida
✓ **Sin venta de datos:** Jamás vendemos, compartimos o alquilamos información de menores
✓ **Seguridad reforzada:** Encriptación end-to-end de toda comunicación
✓ **Supervisión parental:** Los padres pueden solicitar acceso, corrección o eliminación de datos de sus hijos

**Derechos de los menores:**
• Derecho a ser olvidado (eliminación de cuenta)
• Derecho de acceso a su información
• Derecho de rectificación de datos incorrectos
• Derecho a limitar el uso de sus datos`
    },
    {
      title: "3. Datos que Recopilamos",
      content: `**Información de registro (obligatoria):**
• Nombre completo del estudiante
• Edad o grado escolar
• Correo electrónico del padre/tutor (para menores de 14 años)
• Contraseña encriptada

**Información educativa:**
• Personaje guía elegido (Tuko, Pico, Yagui, Rosi, Guido)
• Módulos completados y en progreso
• Interacciones con el tutor cognitivo (preguntas y respuestas)
• Evaluaciones cognitivas invisibles (micro-evidencias de aprendizaje)
• Perfil cognitivo (5 dimensiones: comprensión, representación, razonamiento, transferencia, metacognición)
• Preferencias de aprendizaje

**Información técnica (automática):**
• Tipo de dispositivo y sistema operativo
• Tiempos de uso de la app
• Registro de errores técnicos

**Información que NO recopilamos:**
✗ Ubicación GPS en tiempo real
✗ Lista de contactos
✗ Fotografías o videos del estudiante
✗ Información financiera
✗ Datos biométricos
✗ Historial de navegación fuera de la app`
    },
    {
      title: "4. Cómo Usamos tu Información",
      content: `Utilizamos los datos personales **exclusivamente** para:

**Propósitos educativos principales:**
• Personalizar la experiencia de aprendizaje según el nivel cognitivo del estudiante
• Generar respuestas pedagógicas adaptadas por el tutor inteligente (Tuko y compañía)
• Evaluar progreso cognitivo de forma invisible (sin calificaciones explícitas)
• Recomendar módulos apropiados según competencias
• Generar insights cualitativos sobre el aprendizaje

**Propósitos secundarios:**
• Mejorar algoritmos pedagógicos mediante análisis agregado y anónimo
• Enviar notificaciones importantes (con tu consentimiento)
• Detectar y prevenir uso fraudulento o abusivo
• Cumplir con obligaciones legales cuando sea requerido

**Limitaciones estrictas:**
✗ NO usamos datos para publicidad personalizada
✗ NO vendemos datos a terceros
✗ NO compartimos datos con redes sociales
✗ NO creamos perfiles para marketing
✗ NO rastreamos actividad fuera de Kuneo`
    },
    {
      title: "5. Servicios de Terceros y Transferencias",
      content: `Para funcionar, Kuneo utiliza servicios externos certificados que procesan datos bajo estrictas medidas de seguridad:

**Servicios esenciales:**
• **Supabase (PostgreSQL):** Almacenamiento seguro de datos educativos en servidores ubicados en EE.UU. (cumple con SOC 2 Type II)
• **OpenAI API:** Generación de respuestas pedagógicas del tutor (procesamiento sin almacenamiento permanente)
• **Cloudflare:** Protección contra ataques y encriptación de comunicaciones

**Garantías de transferencias internacionales:**
Cuando los datos se transfieren fuera de Colombia, aseguramos que:
• El país receptor ofrece niveles adecuados de protección de datos
• Existen cláusulas contractuales de protección de datos
• Los proveedores cumplen con certificaciones internacionales (SOC 2, ISO 27001)

**Todos nuestros proveedores firman acuerdos de procesamiento de datos (DPA) que prohíben:**
✗ Uso de datos para entrenar modelos públicos de IA
✗ Compartir datos con otros clientes
✗ Venta o alquiler de información
✗ Almacenamiento indefinido de conversaciones`
    },
    {
      title: "6. Seguridad y Protección de Datos",
      content: `Implementamos medidas técnicas y organizativas de seguridad:

**Medidas técnicas:**
• Encriptación AES-256 de datos en reposo
• TLS 1.3 para todas las comunicaciones
• Autenticación multifactor opcional
• Backups automáticos diarios cifrados
• Auditorías de seguridad trimestrales
• Detección de intrusiones 24/7

**Medidas organizativas:**
• Acceso a datos limitado solo a personal autorizado
• Capacitación anual en protección de datos
• Políticas de contraseñas robustas
• Registro de auditoría de accesos
• Protocolo de respuesta a incidentes

**En caso de brecha de seguridad:**
Nos comprometemos a notificar a los afectados dentro de 72 horas y a la Superintendencia de Industria y Comercio según lo requiere la ley.`
    },
    {
      title: "7. Retención y Eliminación de Datos",
      content: `**Período de retención:**
• **Datos de cuenta activa:** Mientras la cuenta esté activa
• **Datos educativos:** 5 años desde la última interacción (para análisis longitudinal de aprendizaje)
• **Logs técnicos:** 6 meses
• **Conversaciones con tutor:** 2 años (anonimizadas después de 1 año)

**Eliminación de cuenta:**
Puedes solicitar eliminación de tu cuenta en cualquier momento enviando un correo a privacidad@kuneo.app. Eliminaremos:
• Todos los datos personales identificables (nombre, correo, etc.)
• Historial de interacciones con el tutor
• Preferencias y configuraciones

**Datos que conservamos (anonimizados):**
Para investigación educativa, podemos conservar estadísticas agregadas y completamente anonimizadas que no permitan identificación individual.`
    },
    {
      title: "8. Tus Derechos (ARCO)",
      content: `Como titular de datos personales, tienes derecho a:

**Acceso:** Solicitar copia de toda la información que tenemos sobre ti
**Rectificación:** Corregir datos incorrectos o desactualizados
**Cancelación:** Solicitar eliminación de tu cuenta y datos asociados
**Oposición:** Oponerte a ciertos usos de tus datos (ej: notificaciones)

**Ejercicio de derechos:**
Envía tu solicitud a: privacidad@kuneo.app con:
• Nombre completo
• Correo electrónico registrado
• Descripción de la solicitud
• Copia de documento de identidad (para verificación)

Responderemos tu solicitud dentro de 15 días hábiles según lo establece la ley.

**Para menores de 14 años:**
Los padres o tutores pueden ejercer estos derechos en nombre del menor.`
    },
    {
      title: "9. Cookies y Tecnologías de Seguimiento",
      content: `Kuneo utiliza tecnologías de almacenamiento local mínimas:

**Cookies esenciales (obligatorias):**
• Token de sesión de autenticación
• Preferencias de idioma y tema

**Cookies de análisis (opcionales):**
• Estadísticas de uso anónimas (con tu consentimiento)

**NO utilizamos:**
✗ Cookies de publicidad
✗ Cookies de redes sociales
✗ Rastreadores de terceros
✗ Píxeles de seguimiento

Puedes gestionar las cookies desde la configuración de la app.`
    },
    {
      title: "10. Cambios a esta Política",
      content: `Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o requisitos legales.

**Te notificaremos:**
• Por correo electrónico (con 30 días de anticipación)
• Mediante notificación en la app
• En la pantalla de inicio de sesión

**Versión actual:** 2.0 (Abril 2026)
**Versiones anteriores:** Disponibles en kuneo.app/privacidad/historial

Los cambios significativos requerirán tu consentimiento renovado.`
    },
    {
      title: "11. Contacto y Autoridad de Control",
      content: `**Contacto del Responsable:**
Email: privacidad@kuneo.app
Teléfono: +57 (1) 234-5678
Horario: Lunes a Viernes, 8:00 AM - 5:00 PM (hora Colombia)

**Delegado de Protección de Datos:**
Email: dpo@kuneo.app

**Autoridad de Control:**
Si consideras que tus derechos han sido vulnerados, puedes presentar una queja ante:

**Superintendencia de Industria y Comercio (SIC)**
Delegatura para la Protección de Datos Personales
Dirección: Carrera 13 No. 27-00 Piso 5, Bogotá D.C.
Teléfono: +57 (1) 587-0000
Web: www.sic.gov.co
Email: contactenos@sic.gov.co

**Línea gratuita nacional:** 01-8000-910165`
    }
  ];

  const parseMarkdown = (text) => {
    // Split text by lines first, then handle bold markers
    return text.split('\n').map((line, lineIndex) => {
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('✓') || line.trim().startsWith('✗')) {
        return (
          <div key={lineIndex} className="ml-4 mb-2 text-gray-700 dark:text-gray-300">
            {line.trim()}
          </div>
        );
      }
      
      // Handle bold text with **
      const parts = line.split('**');
      return (
        <p key={lineIndex} className="mb-2 text-gray-700 dark:text-gray-300">
          {parts.map((part, index) => {
            // Odd indices are bold text
            if (index % 2 === 1) {
              return <strong key={index} className="font-semibold text-gray-900 dark:text-gray-100">{part}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 py-12 px-4 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Content Container */}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-block mb-6">
            <div className="text-6xl mb-4">🐻‍❄️</div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Política de Privacidad
            </h1>
            <div className="text-lg text-white/90 font-medium">
              <span className="inline-block bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                🔒 Protección especial para menores
              </span>
            </div>
          </div>
          <p className="text-lg text-white/95 max-w-2xl mx-auto">
            Tu privacidad y la de tus estudiantes es nuestra máxima prioridad. 
            Conoce cómo protegemos la información personal.
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          {/* Important Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">ℹ️</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Información Importante
                </h3>
                <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                  Kuneo cumple con las leyes colombianas de protección de datos personales 
                  y derechos de los niños, niñas y adolescentes. Si tienes menos de 14 años, 
                  necesitas el consentimiento de tus padres o tutores para usar la app.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section, index) => (
            <div 
              key={index} 
              className="mb-10 last:mb-0 pb-10 last:pb-0 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold flex-shrink-0">
                  {index + 1}
                </span>
                {section.title.replace(/^\d+\.\s*/, '')}
              </h2>
              <div className="leading-relaxed whitespace-pre-line">
                {parseMarkdown(section.content)}
              </div>
            </div>
          ))}

          {/* CTA Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 text-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                ¿Tienes preguntas sobre tu privacidad?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Estamos aquí para ayudarte. Contáctanos en cualquier momento.
              </p>
              <a 
                href="mailto:privacidad@kuneo.app"
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 
                         hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl
                         shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                📧 privacidad@kuneo.app
              </a>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 
                     text-white font-semibold rounded-xl backdrop-blur-sm
                     transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>
      </div>

      {/* Inline Styles for Animation */}
      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
// client/src/pages/PrivacyPolicy.jsx
