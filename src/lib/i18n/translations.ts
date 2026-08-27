export type Lang = 'fr' | 'en';

export const translations: Record<Lang, Record<string, string>> = {
	fr: {
		'app.title': 'Pictiúr — optimisez vos images, 100% en local',
		'drop.hint': 'Glissez vos images ici',
		'drop.browse': 'ou choisissez des fichiers',
		'settings.title': 'Réglages',
		'settings.format': 'Format de sortie',
		'settings.compress': 'Mode de compression',
		'settings.mode.quality': 'Qualité fixe',
		'settings.mode.weight': 'Poids maximal',
		'settings.quality': 'Qualité',
		'settings.dimensions': 'Dimensions max.',
		'settings.dimensions.none': 'Original',
		'settings.fit': 'Ajustement',
		'fit.contain': 'Contenir (encadré)',
		'fit.cover': 'Couvrir (recadré)',
		'fit.fill': 'Étirer',
		'settings.weightKB': 'Poids max (Ko)',
		'queue.empty': 'Aucune image pour l’instant',
		'queue.count': '{n} image(s)',
		'queue.abortAll': 'Tout annuler',
		'queue.clear': 'Vider les terminés',
		'job.queued': 'En attente',
		'job.processing': 'Optimisation…',
		'job.done': 'Terminé',
		'job.error': 'Erreur',
		'job.aborted': 'Annulé',
		'result.saved': '−{pct} %',
		'result.download': 'Télécharger',
		'result.compare': 'Comparer',
		'result.downloadAll': 'Télécharger tout (ZIP)',
		'error.unsupported': '{name} : format non supporté',
		'error.tooLarge': '{name} : fichier trop lourd (max 100 Mo)'
	},
	en: {
		'app.title': 'Pictiúr — optimize your images, 100% locally',
		'drop.hint': 'Drop your images here',
		'drop.browse': 'or pick files',
		'settings.title': 'Settings',
		'settings.format': 'Output format',
		'settings.compress': 'Compression mode',
		'settings.mode.quality': 'Fixed quality',
		'settings.mode.weight': 'Max file size',
		'settings.quality': 'Quality',
		'settings.dimensions': 'Max dimensions',
		'settings.dimensions.none': 'Original',
		'settings.fit': 'Fit',
		'fit.contain': 'Contain (letterbox)',
		'fit.cover': 'Cover (cropped)',
		'fit.fill': 'Stretch',
		'settings.weightKB': 'Max size (KB)',
		'queue.empty': 'No images yet',
		'queue.count': '{n} image(s)',
		'queue.abortAll': 'Abort all',
		'queue.clear': 'Clear finished',
		'job.queued': 'Queued',
		'job.processing': 'Optimizing…',
		'job.done': 'Done',
		'job.error': 'Error',
		'job.aborted': 'Aborted',
		'result.saved': '−{pct} %',
		'result.download': 'Download',
		'result.compare': 'Compare',
		'result.downloadAll': 'Download all (ZIP)',
		'error.unsupported': '{name}: unsupported format',
		'error.tooLarge': '{name}: file too large (max 100 MB)'
	}
};

export function t(lang: string, key: string, vars: Record<string, string> = {}): string {
	const dict = translations[(lang as Lang) in translations ? (lang as Lang) : 'en'];
	let text = dict[key] ?? translations.en[key] ?? key;
	for (const [k, v] of Object.entries(vars)) {
		text = text.replaceAll(`{${k}}`, v);
	}
	return text;
}
