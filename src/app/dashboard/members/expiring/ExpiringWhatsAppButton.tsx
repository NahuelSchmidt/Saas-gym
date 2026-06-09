"use client";

import { MessageCircle } from "lucide-react";

interface Props {
  memberName: string;
  phone: string | null;
  daysLeft: number;
  planName: string;
}

function formatPhoneArg(phone: string): string {
  // Limpiar caracteres no numéricos
  const cleaned = phone.replace(/\D/g, "");
  // Si ya tiene código de país (54)
  if (cleaned.startsWith("54")) return cleaned;
  // Si empieza con 0, sacar el 0 y agregar 549
  if (cleaned.startsWith("0")) return "549" + cleaned.slice(1);
  // Si empieza con 15, es viejo formato
  if (cleaned.startsWith("15")) return "549" + cleaned.slice(2);
  // Agregar 549 directo
  return "549" + cleaned;
}

export function ExpiringWhatsAppButton({ memberName, phone, daysLeft, planName }: Props) {
  function handleClick() {
    const mensaje =
      daysLeft <= 0
        ? `Hola ${memberName}! 👋 Te avisamos que tu membresía (${planName}) venció hoy. Pasate por el gym para renovarla y seguir entrenando. 💪`
        : daysLeft === 1
        ? `Hola ${memberName}! 👋 Te recordamos que tu membresía (${planName}) vence mañana. Pasate por el gym para renovarla y no perder ningún día de entrenamiento. 💪`
        : `Hola ${memberName}! 👋 Te recordamos que tu membresía (${planName}) vence en ${daysLeft} días. Pasate por el gym para renovarla cuando quieras. 💪`;

    if (!phone) {
      alert("Este miembro no tiene teléfono registrado.");
      return;
    }

    const numero = formatPhoneArg(phone);
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  return (
    <button
      onClick={handleClick}
      title={phone ? "Enviar WhatsApp" : "Sin teléfono registrado"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
        phone
          ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20"
          : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
      }`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </button>
  );
}
