import type {SanityDocumentLike} from "sanity";
import type {SanityClient} from "@sanity/client";

type TranslationReference = {
  value?: {_ref?: string};
};

type TranslationMetadata = {
  _id: string;
  translations?: TranslationReference[];
};

export type TranslationGroup = {
  documentIds: string[];
  metadataId?: string;
};

function publishedId(id: string) {
  return id.replace(/^drafts\./, "");
}

/**
 * The public website treats one English article and its language variants as
 * one editorial item. Keep that lifecycle explicit rather than allowing a
 * hidden translation-metadata document to block the normal Studio actions.
 */
export async function getTranslationGroup(
  client: SanityClient,
  documentId: string,
): Promise<TranslationGroup> {
  const sourceId = publishedId(documentId);
  const metadata = await client.fetch<TranslationMetadata | null>(
    `*[_type == "translation.metadata" && references($documentId)][0]{
      _id,
      translations[]{value{_ref}}
    }`,
    {documentId: sourceId},
  );

  const documentIds = new Set<string>([sourceId]);
  for (const translation of metadata?.translations ?? []) {
    const id = translation.value?._ref;
    if (id) documentIds.add(publishedId(id));
  }

  return {
    documentIds: [...documentIds],
    metadataId: metadata?._id,
  };
}

export function draftId(id: string) {
  return `drafts.${publishedId(id)}`;
}

export function documentForDraft(
  document: SanityDocumentLike,
  nextDraftId: string,
) {
  const {
    _rev: _ignoredRevision,
    _createdAt: _ignoredCreatedAt,
    _updatedAt: _ignoredUpdatedAt,
    _system: _ignoredSystem,
    ...rest
  } = document;

  return {...rest, _id: nextDraftId};
}
