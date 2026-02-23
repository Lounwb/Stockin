import { BrowserMultiFormatReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';

type BarcodeScannerProps = {
  onDetected: (value: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('当前设备不支持摄像头访问');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const text = result.getText();
              onDetected(text);
              stop();
            } else if (err) {
              // 忽略单次失败，继续扫描
              // eslint-disable-next-line no-console
              console.debug(err);
            }
          }
        );
      } catch (e) {
        setError((e as Error).message);
      }
    };

    const stop = () => {
      try {
        if (typeof codeReader.reset === 'function') {
          codeReader.reset();
        }
      } catch (_) {
        // 部分 @zxing 版本无 reset 或实现不同，忽略
      }
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      onClose();
    };

    void start();

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <header className="flex items-center justify-between px-4 pt-10 pb-3 text-slate-50">
        <h2 className="text-base font-semibold">扫码录入</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-500 px-3 py-1 text-xs"
        >
          关闭
        </button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6">
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-700">
          <video
            ref={videoRef}
            className="h-72 w-full bg-black object-cover"
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 border-2 border-emerald-400/70" />
        </div>
        <p className="mt-4 text-center text-xs text-slate-300">
          对准商品条形码，自动识别后会填入表单。
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

