# Pictiúr — Current UI flow (brief for AI collaborators)

> The original design docs assumed files process **automatically on drop**. That changed.
> Keep this in mind when writing UI/tests: the flow is now **staged**.

## 1. Staged processing (no auto-processing on drop)

1. **Drop files** → they appear as cards with status **`ready`** (label « Ready » / « Prêt »), each with a ✕ remove button. Nothing is processed yet — you can add files one by one and tweak the settings.
2. Click **« Start processing (N) »** (EN) / **« Lancer le traitement (N) »** (FR) in the action bar → the batch launches.
3. Cards then go `ready → queued → processing → done` (or `error` / `aborted`).

Important: **the settings are applied at launch time** (`controller.start(toPipelineOptions(settings))`), not at drop time.

## 2. Job statuses

`ready` (staged, waiting to launch) · `queued` (launched, waiting for a worker slot) · `processing` (progress bar) · `done` · `error` · `aborted`.

## 3. Component split (cards)

- **`QueueItem.svelte`** renders `<article class="queue-item">` for `ready` / `queued` / `processing`.
- **`ResultCard.svelte`** renders `<article class="result-card">` for `done` / `error` / `aborted`.
- Selectors in e2e tests must use these real classes (there is no `article.card`).

## 4. Settings panel

- **Format**: radio **pills** (buttons, not a `<select>`) — only **encode** codecs (`kind !== 'decode'`), so HEIC never appears as an output format.
- **Compression**: two radio cards (Fixed quality / Max file size).
- Quality slider shows a live value; PNG shows a lossless note instead of the slider.

## 5. Language

- Default language is **English** (`DEFAULT_SETTINGS.lang = 'en'`); a FR/EN segmented toggle is in the header. i18n values live in `src/lib/i18n/translations.ts` (bilingual by design — don't translate them away).

## 6. e2e convention

Tests run against the dev server and must **click the launch button** after dropping files. See `e2e/ui.spec.ts` and `e2e/heic.spec.ts` for the pattern:

```ts
await input.setInputFiles([...]);
await expect(page.locator('article')).toHaveCount(2);
await page.getByText(/Start processing \(2\)/).click();
await expect(page.locator('article.result-card')).toHaveCount(2, { timeout: 30_000 });
```