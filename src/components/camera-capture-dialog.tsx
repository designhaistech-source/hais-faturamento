import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, Check, AlertTriangle } from "lucide-react";
import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";

type CameraCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the captured photo as a File (JPEG). */
  onCapture: (file: File) => void;
};

/**
 * Captures a photo from the device camera and returns it as a JPEG File,
 * so it can flow through the same pipeline as uploaded files.
 */
export function CameraCaptureDialog({ open, onOpenChange, onCapture }: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setReady(true);
    } catch {
      setError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.",
      );
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setPreview(null);
      setError(null);
      return;
    }
    void startStream();
    return () => stopStream();
  }, [open, startStream, stopStream]);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL("image/jpeg", 0.92));
    stopStream();
  };

  const retake = () => {
    setPreview(null);
    void startStream();
  };

  const confirm = async () => {
    if (!preview) return;
    const blob = await (await fetch(preview)).blob();
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    onCapture(new File([blob], `foto-guia-${stamp}.jpg`, { type: "image/jpeg" }));
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      className="fixed-layout"
      icon={<Camera className="size-4" />}
      title="Tirar foto da guia"
      description="Posicione o documento dentro do quadro e mantenha-o legível antes de capturar."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {preview ? (
            <>
              <Button variant="secondary" onClick={retake}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Nova foto
              </Button>
              <Button onClick={() => void confirm()}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Usar esta foto
              </Button>
            </>
          ) : (
            <Button onClick={takePhoto} disabled={!ready || Boolean(error)}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              Capturar
            </Button>
          )}
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border bg-muted">
        {error ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => void startStream()}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </Button>
          </div>
        ) : preview ? (
          <img src={preview} alt="Pré-visualização da foto capturada" className="w-full" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Visualização da câmera"
            className="w-full aspect-video bg-foreground/5 object-cover"
          />
        )}
      </div>
      {!error && !preview && !ready && (
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          Iniciando a câmera...
        </p>
      )}
    </AppModal>
  );
}
