// SPDX-License-Identifier: EUPL-1.2
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import { FileTrigger } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { assetUrl } from '../../app/assetUrl';
import { useCurrentTenant } from '../../app/contexts';
import { useRepositories } from '../../app/repositories';
import { LANGUAGES } from '../../config/app';
import type { Photo } from '../../domain/types';
import { useLocalized } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import layout from '../../ui/layout.module.css';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import styles from './admin.module.css';
import { resizeImage } from './resizeImage';

export const MAX_PHOTOS = 6;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** The facility's photos, each with its alternative text in every language. */
export function PhotoFields({
  photos,
  onChange,
  field,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  field: (path: string) => { id: string; errorMessage: string | undefined };
}) {
  const { t } = useTranslation('admin');
  const localized = useLocalized();
  const toast = useToast();
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  const addId = useId();
  const upload = useMutation({
    mutationFn: async (files: File[]) =>
      Promise.all(
        files.map(async (file) => {
          const { url } = await repositories.facilities.uploadPhoto(
            tenant.id,
            await resizeImage(file),
          );
          return { id: crypto.randomUUID(), url, alt: { gl: '', es: '' } };
        }),
      ),
  });

  const add = (files: File[]) => {
    const room = MAX_PHOTOS - photos.length;
    upload.mutate(files.slice(0, room), {
      onSuccess: (added) => {
        onChange([...photos, ...added]);
        toast(t('facilityForm.photoAdded', { count: added.length }));
      },
      onError: () => {
        toast(t('facilityForm.photoError'), 'danger');
      },
    });
  };

  return (
    <>
      <p className={layout.meta}>{t('facilityForm.photosHelp')}</p>
      {photos.length > 0 && (
        <ul className={layout.stack}>
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <fieldset className={[layout.panel, styles.photo].join(' ')}>
                <legend>{t('facilityForm.photo', { n: i + 1 })}</legend>
                <img
                  src={assetUrl(photo.url)}
                  alt={localized(photo.alt)}
                  className={styles.photoPreview}
                  width={240}
                  height={160}
                />
                <div className={layout.stack}>
                  {LANGUAGES.map((language) => (
                    <TextField
                      key={language}
                      {...field(`photos.${String(i)}.alt.${language}`)}
                      label={t('facilityForm.photoAltShort', {
                        language: t(`facilityForm.language.${language}`),
                      })}
                      description={t('facilityForm.photoAltHelp')}
                      value={photo.alt[language]}
                      isRequired
                      onChange={(value) => {
                        onChange(
                          photos.map((p) =>
                            p.id === photo.id ? { ...p, alt: { ...p.alt, [language]: value } } : p,
                          ),
                        );
                      }}
                    />
                  ))}
                  <p>
                    <Button
                      variant="dangerSecondary"
                      onPress={() => {
                        onChange(photos.filter((p) => p.id !== photo.id));
                        // The button goes away with the photo; the focus moves to adding a new one.
                        document.getElementById(addId)?.focus();
                      }}
                    >
                      <Icon name="close" />
                      {t('facilityForm.removePhoto', { n: i + 1 })}
                    </Button>
                  </p>
                </div>
              </fieldset>
            </li>
          ))}
        </ul>
      )}
      {photos.length < MAX_PHOTOS ? (
        <p>
          <FileTrigger
            acceptedFileTypes={TYPES}
            allowsMultiple
            onSelect={(list) => {
              if (list) add([...list]);
            }}
          >
            <Button id={addId} isDisabled={upload.isPending}>
              <Icon name="image" />
              {upload.isPending ? t('facilityForm.uploading') : t('facilityForm.addPhotos')}
            </Button>
          </FileTrigger>
        </p>
      ) : (
        <p id={addId} tabIndex={-1} className={layout.meta}>
          {t('facilityForm.photoLimit', { count: MAX_PHOTOS })}
        </p>
      )}
    </>
  );
}
