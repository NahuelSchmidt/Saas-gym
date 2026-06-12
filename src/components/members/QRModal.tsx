"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { QrCode, Download, RefreshCw } from "lucide-react";

import { regenerateQrAction } from "./MemberActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QRModalProps {
  memberName: string;
  qrCode: string | null;
  memberId: string;
}

export function QRModal({ memberName, qrCode, memberId }: QRModalProps) {
  const [open, setOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const router = useRouter();

  async function handleRegenerate() {
    setRegenerating(true);
    await regenerateQrAction(memberId);
    setRegenerating(false);
    router.refresh();
  }

  // qrCode may be a public URL (image) or a raw token string
  const isImageUrl =
    qrCode?.startsWith("http://") || qrCode?.startsWith("https://");

  function handleDownload() {
    if (!qrCode || !isImageUrl) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qr-${memberId}.png`;
    link.click();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          Ver QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Código QR — {memberName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {qrCode && isImageUrl ? (
            <div className="relative h-56 w-56 overflow-hidden rounded-lg border">
              <Image
                src={qrCode}
                alt={`QR de ${memberName}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : qrCode ? (
            /* Fallback: render token as text — browser can encode visually if needed */
            <div className="flex h-56 w-56 items-center justify-center rounded-lg border bg-muted p-4 text-center">
              <p className="break-all font-mono text-xs text-muted-foreground">
                {qrCode}
              </p>
            </div>
          ) : (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-lg border bg-muted gap-2">
              <QrCode className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                QR no disponible aún
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Escaneando este código, el socio puede ver su membresía, vencimiento
            y asistencias desde su celular.
          </p>
        </div>

        <div className="flex gap-2">
          {qrCode && isImageUrl && (
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar QR
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Generando..." : "Generar QR"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
