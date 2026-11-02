export const ENGINE_ERROR_MESSAGES: Record<string, string> = {
  'INGEST_FAILED': 'Impossible de lire les fichiers fournis. Vérifiez le format et réessayez.',
  'SEARCH_FAILED': 'La recherche a échoué. Vous pouvez réessayer ou choisir un autre mode.',
  'SEARCH_LOCAL_EMPTY': 'Aucun résultat dans la base locale. Recherche étendue en cours.',
  'SEARCH_WEB_FALLBACK_USED': 'Résultats complétés via recherche étendue.',
  'SEARCH_WEB_FAILED': 'La recherche étendue a échoué.',
  'SEARCH_EMBEDDING_FAILED': 'Le service d\'embedding est indisponible. Recherche locale heuristique utilisée.',
  'RECONSTRUCT_FAILED': 'La reconstruction a échoué. Un candidat généré est proposé en fallback.',
  'ARCHIVE_FAILED': 'L\'archivage a échoué, mais votre résultat est disponible.',
  'GROQ_TIMEOUT': 'Le service IA met trop de temps à répondre. Réessayez dans quelques instants.',
  'GROQ_HTTP_ERROR': 'Le service IA a renvoyé une erreur. Réessayez ou contactez le support.',
  'GROQ_EMPTY_RESPONSE': 'Le service IA n\'a pas renvoyé de contenu exploitable. Reformulez votre demande.',
  'GROQ_MODEL_DEPRECATED': 'Le modèle IA a été mis à jour. Contactez le support pour plus d\'informations.',
  'CAD_GENERATION_FAILED': 'La génération 3D a échoué. Vous pouvez réessayer avec des paramètres différents.',
  'SOURCE_FAILED': 'Une source externe a échoué.',
  'SOURCE_TIMEOUT': 'Une source externe a mis trop de temps à répondre.',
  'CIRCUIT_OPEN': 'Une source externe est temporairement indisponible (circuit ouvert).',
  'VISION_DOWNLOAD_FAILED': "Échec du téléchargement de l'image.",
  'VISION_TOO_MANY_IMAGES': "Trop d'images transmises (maximum 3).",
  'VISION_IMAGE_TOO_LARGE': "Image trop volumineuse (maximum 5 Mo).",
  'VISION_PARSE_FAILED': "Réponse du modèle IA non exploitable.",
  'SOURCE_MOCK': 'Ce connecteur utilise des donn�es de d�monstration (non r�elles).',
};

export function getErrorMessage(code: string): string {
  return ENGINE_ERROR_MESSAGES[code] ?? 'Une erreur est survenue. Réessayez ou contactez le support.';
}


