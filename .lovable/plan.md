## Mål
Legge til manglende UPDATE-policy på storage-bøtta `tilstandsvurdering-images` slik at kun eieren av en fil (basert på mappenavn = bruker-id) kan overskrive sine egne bilder.

## Endring (kun database)

Opprette én ny RLS-policy på `storage.objects`:

```sql
CREATE POLICY "Users can update own tilstandsvurdering images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tilstandsvurdering-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tilstandsvurdering-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Hva endres ikke
- Ingen frontend-endringer.
- Eksisterende INSERT-, SELECT- og DELETE-policyer beholdes uendret.
- Bøtta forblir public (lesbar for visning i rapporter).

## Verifisering
- Last opp et bilde som bruker A → fungerer.
- Forsøk å overskrive bilde fra bruker A som bruker B → blokkeres.
- Marker sikkerhetsfunnet `tilstandsvurdering_images_no_update_policy` som løst.
