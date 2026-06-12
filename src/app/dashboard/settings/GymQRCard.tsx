"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GymQRCard({ gymId, gymName }: { gymId: string; gymName: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/g/${gymId}`;

  useEffect(() => {
    QRCode.toDataURL(portalUrl, { width: 400, margin: 2 }).then(setDataUrl);
  }, [portalUrl]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-${gymName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  }

  function handlePrint() {
    if (!dataUrl) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>QR ${gymName}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;">
          <h1 style="margin-bottom:8px;">${gymName}</h1>
          <p style="margin-bottom:24px;font-size:18px;">Escaneá para ver tu membresía</p>
          <img src="${dataUrl}" width="400" height="400" />
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="w-4 h-4" />
          QR del gimnasio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Imprimí este código y pegalo en la recepción. Tus socios lo escanean,
          ingresan su DNI y ven su membresía, vencimiento y asistencias.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR del gimnasio" className="w-40 h-40 rounded-lg border" />
          ) : (
            <div className="w-40 h-40 rounded-lg border bg-muted animate-pulse" />
          )}

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!dataUrl}>
              <Download className="mr-2 h-4 w-4" />
              Descargar imagen
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!dataUrl}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir cartel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
