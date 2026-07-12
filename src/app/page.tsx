"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

const ACCENT_ORANGE = "#FF5A1F";
const ACCENT_LIME = "#C6FF3A";

const DARK = {
  bg: "#0B0D10", bgAlt: "#0E1013", card: "#161A20",
  border: "rgba(255,255,255,0.07)", borderSubtle: "rgba(255,255,255,0.06)", borderStrong: "rgba(255,255,255,0.18)",
  text: "#F5F3EF", textMuted: "#8A8780", textFaint: "#7A776F", textBody: "#D8D5CE", copyright: "#5F5D57",
  navBg: "rgba(11,13,16,0.92)", navLink: "#C9C6C0", inputBg: "#161A20", inputBorder: "rgba(255,255,255,0.15)",
  ctaGradFrom: "#1A0F06",
};
const LIGHT = {
  bg: "#F7F6F3", bgAlt: "#EEECE6", card: "#FFFFFF",
  border: "rgba(20,23,26,0.09)", borderSubtle: "rgba(20,23,26,0.07)", borderStrong: "rgba(20,23,26,0.18)",
  text: "#14171A", textMuted: "#6B6860", textFaint: "#8A8780", textBody: "#3A3833", copyright: "#A6A39B",
  navBg: "rgba(247,246,243,0.92)", navLink: "#4A4740", inputBg: "#FFFFFF", inputBorder: "rgba(20,23,26,0.15)",
  ctaGradFrom: "#FCEFE6",
};

// SVG icons — stroke style, color injected via `color` prop
const ICONS: Record<string, (color: string) => React.ReactNode> = {
  table: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
  money: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 0 1 3-3m0 3a3 3 0 0 1 3 3"/></svg>,
  clipboard: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  lock: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1" fill={c}/></svg>,
  users: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  card: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  door: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="15" cy="13" r="1" fill={c}/></svg>,
  phone: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  chart: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  bell: (c) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const PAIN_POINTS = [
  { iconKey: "table", problem: "Planillas de Excel por todos lados", pain: "Datos de clientes desactualizados, duplicados y difíciles de encontrar cuando los necesitás.", solution: "Un solo panel con toda la info de cada socio" },
  { iconKey: "money", problem: "Clientes que no pagan a tiempo", pain: "Perseguís cobros por WhatsApp y perdés plata todos los meses por cuotas vencidas.", solution: "Cobro automático y recordatorios sin que muevas un dedo" },
  { iconKey: "clipboard", problem: "Altas y bajas a mano", pain: "Cargar un socio nuevo o dar de baja a otro te saca minutos valiosos todos los días.", solution: "Altas, bajas y cambios de plan en segundos" },
  { iconKey: "lock", problem: "Sin control real de accesos", pain: "No sabés quién entrenó hoy ni si un socio con la cuota vencida sigue entrando al gym.", solution: "Control de accesos que bloquea automáticamente a morosos" },
];

const FEATURES = [
  { iconKey: "users", accentBg: "rgba(255,90,31,0.12)", iconColor: ACCENT_ORANGE, title: "Control de membresías", desc: "Gestioná altas, bajas, congelamientos y cambios de plan desde un solo lugar, sin papeles." },
  { iconKey: "card", accentBg: "rgba(255,90,31,0.12)", iconColor: ACCENT_ORANGE, title: "Cobros automáticos", desc: "Débito automático, Mercado Pago y recordatorios de vencimiento que cobran por vos." },
  { iconKey: "door", accentBg: "rgba(255,90,31,0.12)", iconColor: ACCENT_ORANGE, title: "Accesos y asistencia", desc: "Control biométrico o por QR que bloquea el acceso a socios con cuotas vencidas." },
  { iconKey: "phone", accentBg: "rgba(255,90,31,0.12)", iconColor: ACCENT_ORANGE, title: "App para tus clientes", desc: "Tus socios reservan clases, ven su cuota y pagan desde el celular sin llamarte." },
  { iconKey: "chart", accentBg: "rgba(255,90,31,0.12)", iconColor: ACCENT_ORANGE, title: "Reportes y estadísticas", desc: "Ingresos, bajas, ocupación de clases y proyección de caja, siempre a mano." },
  { iconKey: "bell", accentBg: "rgba(255,90,31,0.12)", iconColor: ACCENT_ORANGE, title: "Recordatorios automáticos", desc: "Avisos de vencimiento por WhatsApp y email antes de que el socio se atrase." },
];

const COMPARISON_ROWS = [
  "Cobro automático de cuotas",
  "Recordatorios de vencimiento",
  "Control de accesos en tiempo real",
  "App para que el socio pague y reserve",
  "Reportes de caja e ingresos al instante",
  "Datos centralizados, sin duplicados",
];

const STEPS = [
  { n: "01", title: "Cargá tu gym", desc: "Importá tus socios, planes y precios en minutos. Nuestro equipo te ayuda con la migración gratis." },
  { n: "02", title: "Gestioná clientes", desc: "Cobros, accesos y asistencia se manejan solos. Vos revisás el panel cuando quieras." },
  { n: "03", title: "Hacé crecer tu negocio", desc: "Con el tiempo que ganás y los datos del panel, tomás mejores decisiones y sumás más socios." },
];

const TESTIMONIALS = [
  { quote: "Dejé de perder plata en cuotas vencidas. NexaGym cobra solo y yo me enfoco en entrenar a mi gente.", name: "Martín Rearte", gym: "Dueño, Fuerza Box CrossFit", initials: "MR", avatarBg: ACCENT_ORANGE },
  { quote: "Antes tardaba dos días en cerrar la caja del mes. Ahora tengo el reporte listo en un click.", name: "Carolina Ibarra", gym: "Dueña, Estudio Flow Pilates", initials: "CI", avatarBg: ACCENT_LIME },
  { quote: "El control de accesos solo me cambió el negocio: nadie entrena más si no pagó la cuota.", name: "Diego Salvatierra", gym: "Dueño, Titanium Gym", initials: "DS", avatarBg: ACCENT_ORANGE },
];

const GYM_LOGOS = ["FUERZA BOX", "TITANIUM GYM", "FLOW PILATES", "IRONWILL", "ATLAS FITNESS", "PURA ENERGÍA"];

const PLANS_RAW = [
  { name: "Starter", subtitle: "Para gimnasios chicos o que recién arrancan", priceMonthly: "$24.900", priceYearly: "$19.900", featured: false, items: ["Hasta 150 socios activos", "Control de membresías y pagos", "App para clientes", "Recordatorios automáticos", "Soporte por email"] },
  { name: "Pro", subtitle: "El más elegido por boxes y estudios", priceMonthly: "$44.900", priceYearly: "$35.900", featured: true, items: ["Hasta 500 socios activos", "Todo lo de Starter", "Control de accesos (QR/biométrico)", "Reportes y estadísticas avanzadas", "Soporte prioritario por WhatsApp"] },
  { name: "Network", subtitle: "Para cadenas con varias sedes", priceMonthly: "$79.900", priceYearly: "$63.900", featured: false, items: ["Socios ilimitados", "Todo lo de Pro", "Multi-sede con panel unificado", "Roles y permisos por sucursal", "Onboarding y soporte dedicado"] },
];

const FAQS = [
  { q: "¿Necesito instalar algo o tarjeta de crédito para probar?", a: "No. NexaGym funciona 100% desde el navegador y desde la app. Podés empezar tu prueba gratuita de 14 días sin cargar ninguna tarjeta." },
  { q: "¿Puedo migrar mis clientes desde una planilla de Excel?", a: "Sí, importás tu planilla actual en minutos con nuestra herramienta de carga masiva, o te ayuda nuestro equipo de soporte sin costo extra." },
  { q: "¿Cómo cobra NexaGym a mis clientes automáticamente?", a: "Conectás tu cuenta bancaria o Mercado Pago y NexaGym cobra las cuotas de forma automática en la fecha de vencimiento, con reintentos y recordatorios incluidos." },
  { q: "¿Sirve para boxes de crossfit o estudios de yoga/pilates?", a: "Sí. Además de gimnasios tradicionales, NexaGym se adapta a boxes, estudios y academias con clases por turnos, cupos y reservas." },
  { q: "¿Hay permanencia mínima en los planes?", a: "No. Todos los planes son mes a mes y podés cancelar cuando quieras desde el panel, sin llamadas ni trámites." },
];

const ATTENDANCE_BARS = [40, 65, 52, 88, 60, 95, 70];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(28px)", transition: "opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)" }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ctaEmail, setCtaEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Login modal
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const t = isDark ? DARK : LIGHT;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (error) {
      setLoginError("Email o contraseña incorrectos.");
    } else {
      router.push("/dashboard");
    }
  }

  function openLogin() {
    setLoginError("");
    setLoginEmail("");
    setLoginPassword("");
    setLoginOpen(true);
  }

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", overflowX: "hidden", fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes floatSlow { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-14px); } }
        @keyframes pulseGlow { 0%,100% { opacity:.5; } 50% { opacity:.9; } }
        * { box-sizing: border-box; }
        ::selection { background: ${ACCENT_ORANGE}; color: #0B0D10; }
        .nx-hover-orange:hover { border-color: ${ACCENT_ORANGE} !important; }
        .nx-hover-lift:hover { transform: translateY(-3px); }
        .nx-nav-link { text-decoration: none; font-size: 14px; font-weight: 500; transition: color .15s; }
        .nx-nav-link:hover { color: ${t.text} !important; }
        .btn-primary { transition: transform .15s ease, background .15s; }
        .btn-primary:hover { transform: translateY(-2px); background: #FF7A45 !important; }
        .btn-outline:hover { border-color: ${ACCENT_LIME} !important; color: ${ACCENT_LIME} !important; }
        @media (max-width: 860px) {
          .nx-hero { grid-template-columns: 1fr !important; padding-top: 40px !important; padding-bottom: 48px !important; }
          .nx-hero h1 { font-size: 38px !important; }
          .nx-hide-mobile { display: none !important; }
          .nx-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px 20px !important; }
        }
        @media (max-width: 560px) {
          .nx-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 6vw", background: t.navBg, backdropFilter: "blur(10px)", borderBottom: `1px solid ${t.borderSubtle}` }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/logos/nexagym-isotype-transparent.png" alt="NexaGym" width={28} height={28} priority />
          NEXA<span style={{ color: ACCENT_ORANGE }}>GYM</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" className="nx-nav-link nx-hide-mobile" style={{ color: t.navLink }}>Funciones</a>
          <a href="#pricing" className="nx-nav-link nx-hide-mobile" style={{ color: t.navLink }}>Precios</a>
          <a href="#faq" className="nx-nav-link nx-hide-mobile" style={{ color: t.navLink }}>Preguntas</a>
          <button onClick={() => setIsDark(d => !d)} style={{ border: `1px solid ${t.borderSubtle}`, background: "transparent", color: t.text, width: 38, height: 38, borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isDark
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button onClick={openLogin} style={{ border: "none", cursor: "pointer", background: "transparent", color: t.navLink, fontWeight: 600, fontSize: 14, padding: "10px 0", fontFamily: "inherit" }} className="nx-nav-link nx-hide-mobile">Ingresar</button>
          <a href="#cta-final" style={{ textDecoration: "none", background: ACCENT_ORANGE, color: "#0B0D10", fontWeight: 700, fontSize: 14, padding: "10px 16px", borderRadius: 8, whiteSpace: "nowrap" }}>Empezá gratis</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", padding: "96px 6vw 80px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 48, alignItems: "center", maxWidth: 1440, margin: "0 auto" }} className="nx-hero">
        <div style={{ position: "absolute", top: -160, right: -160, width: 600, height: 600, background: "radial-gradient(circle, rgba(255,90,31,0.22) 0%, rgba(255,90,31,0) 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(198,255,58,0.10) 0%, rgba(198,255,58,0) 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(198,255,58,0.1)", border: "1px solid rgba(198,255,58,0.3)", color: "#7DA82A", fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 100, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT_LIME, animation: "pulseGlow 2s infinite", display: "inline-block" }} />
            +1.200 gimnasios ya gestionan todo desde NexaGym
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(40px,4.6vw,66px)", lineHeight: 1.02, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 24px" }}>
            Recuperá horas por semana.<br />
            Empezá a hacer <span style={{ color: ACCENT_ORANGE }}>crecer tu gimnasio.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: t.textBody, maxWidth: 520, margin: "0 0 36px" }}>
            NexaGym automatiza cobros, altas, accesos y recordatorios en un solo panel. Dejá de perder tiempo en planillas y WhatsApp, y usalo en lo que hace crecer tu negocio.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
            <a href="#cta-final" className="btn-primary" style={{ textDecoration: "none", background: ACCENT_ORANGE, color: "#0B0D10", fontWeight: 700, fontSize: 16, padding: "16px 30px", borderRadius: 10, boxShadow: "0 8px 24px rgba(255,90,31,0.35)" }}>Empezá gratis 14 días →</a>
            <a href="#demo" className="btn-outline" style={{ textDecoration: "none", background: "transparent", color: t.text, fontWeight: 600, fontSize: 16, padding: "16px 28px", borderRadius: 10, border: `1.5px solid ${t.borderStrong}` }}>▶ Ver demo (2 min)</a>
          </div>
          <p style={{ fontSize: 13, color: t.textFaint, margin: 0 }}>No pedimos tarjeta de crédito. Cancelás cuando quieras.</p>
        </div>

        {/* Dashboard mockup */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ position: "relative", background: "linear-gradient(160deg,#161A20,#0E1013)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", animation: "floatSlow 6s ease-in-out infinite" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", display: "inline-block" }} />
              <span style={{ marginLeft: 10, fontSize: 12, color: "#726F68" }}>panel.nexagym.app</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: "#F5F3EF" }}>Resumen de hoy</div>
              <div style={{ fontSize: 12, background: "rgba(198,255,58,0.12)", color: ACCENT_LIME, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>En vivo</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#8A8780", marginBottom: 6 }}>Cobros del mes</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#F5F3EF" }}>$4.82M</div>
                <div style={{ fontSize: 12, color: ACCENT_LIME, marginTop: 4 }}>↑ 18% vs mes pasado</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#8A8780", marginBottom: 6 }}>Miembros activos</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: "#F5F3EF" }}>386</div>
                <div style={{ fontSize: 12, color: ACCENT_ORANGE, marginTop: 4 }}>+24 esta semana</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8A8780", marginBottom: 10 }}>
                <span>Asistencia semanal</span><span>Lun–Dom</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                {ATTENDANCE_BARS.map((h, i) => (
                  <div key={i} style={{ flex: 1, background: `linear-gradient(180deg,${ACCENT_ORANGE},rgba(255,90,31,0.25))`, height: `${h}%`, borderRadius: "4px 4px 0 0" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,90,31,0.08)", border: "1px solid rgba(255,90,31,0.25)", borderRadius: 12, padding: "12px 14px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT_ORANGE, display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "#D8D5CE" }}>3 membresías vencen mañana — recordatorio automático enviado</span>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <Reveal>
        <section style={{ padding: "40px 6vw 64px", textAlign: "center", borderTop: `1px solid ${t.borderSubtle}` }}>
          <p style={{ fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", color: t.textFaint, margin: "0 0 28px", fontWeight: 600 }}>Gimnasios que ya confían en NexaGym</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 48, opacity: 0.8 }}>
            {GYM_LOGOS.map(name => (
              <div key={name} style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: t.textBody, letterSpacing: "-0.01em" }}>{name}</div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* PROBLEMA / SOLUCIÓN */}
      <Reveal>
        <section style={{ padding: "80px 6vw", background: t.bgAlt, borderTop: `1px solid ${t.borderSubtle}`, borderBottom: `1px solid ${t.borderSubtle}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}>
              <span style={{ color: ACCENT_ORANGE, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>El problema de siempre</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>Administrar un gym a mano te está costando plata</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
              {PAIN_POINTS.map(p => (
                <div key={p.problem} className="nx-hover-lift" style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, transition: "border-color .2s, transform .2s" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,90,31,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{ICONS[p.iconKey]?.(ACCENT_ORANGE)}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{p.problem}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: t.textMuted, marginBottom: 12 }}>{p.pain}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#4C8A17", fontWeight: 600 }}>
                    <span>✓</span><span>{p.solution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* VS EXCEL */}
      <Reveal>
        <section style={{ padding: "88px 6vw" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 48px", textAlign: "center" }}>
              <span style={{ color: ACCENT_ORANGE, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>La diferencia real</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>Excel y WhatsApp no fueron hechos para gestionar un gimnasio</h2>
            </div>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr" }}>
                <div style={{ padding: "20px 24px" }} />
                <div style={{ padding: "20px 16px", textAlign: "center", background: t.bgAlt }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: t.textMuted }}>Excel + WhatsApp</div>
                </div>
                <div style={{ padding: "20px 16px", textAlign: "center", background: ACCENT_ORANGE }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "#0B0D10" }}>NexaGym</div>
                </div>
              </div>
              {COMPARISON_ROWS.map(label => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderTop: `1px solid ${t.border}` }}>
                  <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", fontSize: 14.5, fontWeight: 500 }}>{label}</div>
                  <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "center", background: t.bgAlt, fontSize: 18, color: t.textFaint }}>✕</div>
                  <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,90,31,0.06)", fontSize: 18, fontWeight: 700, color: "#4C8A17" }}>✓</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* FEATURES */}
      <Reveal>
        <section id="features" style={{ padding: "88px 6vw" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}>
              <span style={{ color: "#4C8A17", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Todo en un solo lugar</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>El panel que controla todo tu gimnasio</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
              {FEATURES.map(f => (
                <div key={f.title} className="nx-hover-orange" style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: 30, transition: "border-color .2s" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: f.accentBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{ICONS[f.iconKey]?.(f.iconColor)}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, marginBottom: 10 }}>{f.title}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.55, color: t.textMuted }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* VIDEO DEMO */}
      <Reveal>
        <section id="demo" style={{ padding: "88px 6vw" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 40px", textAlign: "center" }}>
              <span style={{ color: ACCENT_ORANGE, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Miralo en acción</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>Todo NexaGym en 2 minutos</h2>
            </div>
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: `1px solid ${t.border}`, boxShadow: "0 30px 70px rgba(0,0,0,0.25)", aspectRatio: "16/9", background: isDark ? "#0E1013" : "#EEECE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: ACCENT_ORANGE, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(255,90,31,0.45)", cursor: "pointer" }}>
                <div style={{ width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderLeft: "26px solid #0B0D10", marginLeft: 6 }} />
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px", background: "linear-gradient(0deg, rgba(0,0,0,0.55), transparent)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#F5F3EF", fontWeight: 600, fontSize: 14 }}>Recorrido completo del panel NexaGym</span>
                <span style={{ color: "#F5F3EF", fontSize: 13, background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 6 }}>2:04</span>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* HOW IT WORKS */}
      <Reveal>
        <section id="how" style={{ padding: "88px 6vw", background: t.bgAlt, borderTop: `1px solid ${t.borderSubtle}`, borderBottom: `1px solid ${t.borderSubtle}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}>
              <span style={{ color: ACCENT_ORANGE, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Simple de verdad</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>Empezás a operar en menos de un día</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 32 }}>
              {STEPS.map(s => (
                <div key={s.n} style={{ padding: 8 }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 56, fontWeight: 700, color: "transparent", WebkitTextStroke: `1.5px ${t.borderStrong}`, marginBottom: 8 }}>{s.n}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 19, marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.55, color: t.textMuted }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* TESTIMONIALS */}
      <Reveal>
        <section style={{ padding: "88px 6vw" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}>
              <span style={{ color: "#4C8A17", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Resultados reales</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>Dueños de gym que ya ganaron tiempo y plata</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
              {TESTIMONIALS.map(t2 => (
                <div key={t2.name} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ color: ACCENT_ORANGE, fontSize: 15, letterSpacing: 2 }}>★★★★★</div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: t.textBody, margin: 0, flex: 1 }}>&ldquo;{t2.quote}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: t2.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#0B0D10" }}>{t2.initials}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t2.name}</div>
                      <div style={{ fontSize: 13, color: t.textMuted }}>{t2.gym}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* PRICING */}
      <Reveal>
        <section id="pricing" style={{ padding: "88px 6vw", background: t.bgAlt, borderTop: `1px solid ${t.borderSubtle}`, borderBottom: `1px solid ${t.borderSubtle}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 44px", textAlign: "center" }}>
              <span style={{ color: ACCENT_ORANGE, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Precios</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(30px,3.2vw,42px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 12px" }}>Un plan para cada tamaño de gimnasio</h2>
              <p style={{ fontSize: 15, color: t.textMuted, margin: 0 }}>Precios en pesos argentinos. Sin permanencia mínima.</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 44 }}>
              <div style={{ display: "inline-flex", background: t.card, border: `1px solid ${t.border}`, borderRadius: 100, padding: 4 }}>
                <button onClick={() => setIsYearly(false)} style={{ border: "none", cursor: "pointer", padding: "9px 20px", borderRadius: 100, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", background: isYearly ? "transparent" : ACCENT_ORANGE, color: isYearly ? t.textMuted : "#0B0D10" }}>Mensual</button>
                <button onClick={() => setIsYearly(true)} style={{ border: "none", cursor: "pointer", padding: "9px 20px", borderRadius: 100, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, background: isYearly ? ACCENT_ORANGE : "transparent", color: isYearly ? "#0B0D10" : t.textMuted }}>
                  Anual <span style={{ background: "rgba(198,255,58,0.18)", color: "#4C8A17", fontSize: 11, padding: "2px 7px", borderRadius: 6 }}>-20%</span>
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, alignItems: "stretch" }}>
              {PLANS_RAW.map(pl => (
                <div key={pl.name} style={{ background: pl.featured ? (isDark ? "linear-gradient(160deg,#1E1408,#161A20)" : "linear-gradient(160deg,#FFF3E9,#FFFFFF)") : t.card, border: `1.5px solid ${pl.featured ? ACCENT_ORANGE : t.border}`, borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", position: "relative" }}>
                  {pl.featured && <div style={{ position: "absolute", top: -13, left: 32, background: ACCENT_ORANGE, color: "#0B0D10", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 100 }}>Más elegido</div>}
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 19, marginBottom: 6 }}>{pl.name}</div>
                  <div style={{ fontSize: 13.5, color: t.textMuted, marginBottom: 22 }}>{pl.subtitle}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 26 }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 38, fontWeight: 700 }}>{isYearly ? pl.priceYearly : pl.priceMonthly}</span>
                    <span style={{ fontSize: 14, color: t.textMuted }}>/mes</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 28, flex: 1 }}>
                    {pl.items.map(it => (
                      <div key={it} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: t.textBody }}>
                        <span style={{ color: "#4C8A17", fontWeight: 700 }}>✓</span><span>{it}</span>
                      </div>
                    ))}
                  </div>
                  <a href="#cta-final" className="btn-outline" style={{ textDecoration: "none", textAlign: "center", padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 15, background: pl.featured ? ACCENT_ORANGE : "transparent", color: pl.featured ? "#0B0D10" : t.text, border: `1.5px solid ${pl.featured ? ACCENT_ORANGE : t.borderStrong}`, display: "block" }}>Empezar ahora</a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <section id="faq" style={{ padding: "88px 6vw" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <div style={{ maxWidth: 640, margin: "0 auto 44px", textAlign: "center" }}>
              <span style={{ color: "#4C8A17", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dudas frecuentes</span>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(28px,3vw,38px)", fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>Todo lo que necesitás saber</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {FAQS.map((fq, i) => (
                <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
                  <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", cursor: "pointer", fontWeight: 600, fontSize: 15.5 }}>
                    <span>{fq.q}</span>
                    <span style={{ color: ACCENT_ORANGE, fontSize: 20, flexShrink: 0, marginLeft: 16 }}>{openFaq === i ? "−" : "+"}</span>
                  </div>
                  {openFaq === i && (
                    <div style={{ padding: "0 24px 22px", fontSize: 14.5, lineHeight: 1.6, color: t.textMuted }}>{fq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CTA FINAL */}
      <Reveal>
        <section id="cta-final" style={{ padding: "96px 6vw", position: "relative", overflow: "hidden", background: `linear-gradient(135deg,${t.ctaGradFrom},${t.bg} 60%)` }}>
          <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(255,90,31,0.25) 0%, rgba(255,90,31,0) 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4vw,50px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 20px" }}>Empezá a controlar tu gimnasio hoy</h2>
            <p style={{ fontSize: 17, color: t.textBody, margin: "0 0 36px" }}>Sumate a los gimnasios que dejaron el Excel atrás. Probalo gratis 14 días, sin tarjeta.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
              <input type="email" required placeholder="tu@email.com" value={ctaEmail} onChange={e => setCtaEmail(e.target.value)} style={{ flex: 1, minWidth: 240, padding: "16px 20px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: 15, fontFamily: "inherit" }} />
              <button type="submit" style={{ border: "none", cursor: "pointer", background: ACCENT_ORANGE, color: "#0B0D10", fontWeight: 700, fontSize: 15, padding: "16px 30px", borderRadius: 10, whiteSpace: "nowrap", fontFamily: "inherit" }}>Empezar gratis →</button>
            </form>
            {submitted && <p style={{ color: "#4C8A17", fontSize: 14, fontWeight: 600 }}>¡Listo! Te escribimos en breve a {ctaEmail} 🎉</p>}
            <p style={{ fontSize: 13, color: t.textFaint, margin: "8px 0 0" }}>Sin tarjeta de crédito · Cancelás cuando quieras · Soporte en español</p>
          </div>
        </section>
      </Reveal>

      {/* FOOTER */}
      <footer style={{ padding: "56px 6vw 32px", borderTop: `1px solid ${t.borderSubtle}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32, marginBottom: 40 }} className="nx-footer-grid">
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Image src="/logos/nexagym-isotype-transparent.png" alt="NexaGym" width={24} height={24} />
                NEXA<span style={{ color: ACCENT_ORANGE }}>GYM</span>
              </div>
              <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, maxWidth: 280 }}>El sistema de gestión para gimnasios, boxes de crossfit y estudios que quieren crecer sin perder el control.</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Producto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["Funciones", "Precios", "Cómo funciona", "Preguntas"].map(l => (
                  <a key={l} href={`#${l === "Funciones" ? "features" : l === "Precios" ? "pricing" : l === "Cómo funciona" ? "how" : "faq"}`} style={{ textDecoration: "none", color: t.textMuted, fontSize: 14 }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Empresa</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["Nosotros", "Blog", "Trabajá con nosotros"].map(l => (
                  <a key={l} href="#" style={{ textDecoration: "none", color: t.textMuted, fontSize: 14 }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Contacto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href="mailto:hola@nexagym.app" style={{ textDecoration: "none", color: t.textMuted, fontSize: 14 }}>hola@nexagym.app</a>
                <a href="#" style={{ textDecoration: "none", color: t.textMuted, fontSize: 14 }}>+54 11 5555-0199</a>
                <a href="#" style={{ textDecoration: "none", color: t.textMuted, fontSize: 14 }}>Buenos Aires, AR</a>
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 24, borderTop: `1px solid ${t.borderSubtle}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: t.copyright }}>© 2026 NexaGym. Todos los derechos reservados.</span>
            <div style={{ display: "flex", gap: 24 }}>
              <a href="#" style={{ textDecoration: "none", color: t.copyright, fontSize: 13 }}>Privacidad</a>
              <a href="#" style={{ textDecoration: "none", color: t.copyright, fontSize: 13 }}>Términos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login modal */}
      {loginOpen && (
        <div onClick={() => setLoginOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: isDark ? "#161A20" : "#FFFFFF", border: `1px solid ${t.border}`, borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.35)", position: "relative" }}>
            <button onClick={() => setLoginOpen(false)} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: t.textMuted, fontSize: 20, lineHeight: 1 }}>✕</button>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Image src="/logos/nexagym-isotype-transparent.png" alt="NexaGym" width={26} height={26} />
              NEXA<span style={{ color: ACCENT_ORANGE }}>GYM</span>
            </div>
            <p style={{ color: t.textMuted, fontSize: 14, margin: "0 0 28px" }}>Ingresá a tu panel de administración</p>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 6 }}>Email</label>
                <input
                  type="email" required autoFocus
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${loginError ? "#EF4444" : t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: 15, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 6 }}>Contraseña</label>
                <input
                  type="password" required
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${loginError ? "#EF4444" : t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: 15, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              {loginError && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{loginError}</p>}
              <button
                type="submit" disabled={loginLoading}
                style={{ border: "none", cursor: loginLoading ? "not-allowed" : "pointer", background: ACCENT_ORANGE, color: "#0B0D10", fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 10, fontFamily: "inherit", opacity: loginLoading ? 0.7 : 1, marginTop: 4 }}
              >
                {loginLoading ? "Ingresando..." : "Ingresar al panel →"}
              </button>
            </form>
            <p style={{ textAlign: "center", fontSize: 13, color: t.textMuted, marginTop: 20 }}>
              ¿Olvidaste tu contraseña?{" "}
              <a href="/auth/reset-password" style={{ color: ACCENT_ORANGE, textDecoration: "none", fontWeight: 600 }}>Recuperar</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
