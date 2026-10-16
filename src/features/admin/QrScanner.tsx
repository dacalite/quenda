// SPDX-License-Identifier: EUPL-1.2
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import layout from '../../ui/layout.module.css';
import styles from './admin.module.css';
import { barcodeDetector } from './barcode';

/** Reads a booking QR with the rear camera; typing the code is always the alternative. */
export function QrScanner({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const found = useEffectEvent(onCode);

  useEffect(() => {
    const Detector = barcodeDetector();
    if (!Detector) return;
    const detector = new Detector({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const scan = async () => {
      if (stopped || !video.current) return;
      const code = (await detector.detect(video.current).catch(() => []))[0]?.rawValue;
      if (code) found(code);
      else timer = setTimeout(() => void scan(), 300);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (media) => {
        stream = media;
        if (stopped || !video.current) return;
        video.current.srcObject = media;
        await video.current.play();
        await scan();
      })
      .catch(() => {
        setFailed(true);
      });

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  return (
    <div className={layout.panel}>
      {failed ? (
        <p role="alert">{t('access.cameraFailed')}</p>
      ) : (
        <>
          <p>{t('access.cameraHelp')}</p>
          <video
            ref={video}
            className={styles.video}
            aria-label={t('access.cameraView')}
            muted
            playsInline
          />
        </>
      )}
      <p>
        <Button onPress={onClose}>{t('access.closeCamera')}</Button>
      </p>
    </div>
  );
}
