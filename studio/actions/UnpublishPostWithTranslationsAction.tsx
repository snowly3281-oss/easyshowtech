import {useCallback} from "react";
import {useToast} from "@sanity/ui";
import {
  type DocumentActionComponent,
  type SanityDocumentLike,
  useClient,
} from "sanity";
import {getTranslationGroup, documentForDraft, draftId} from "./translationGroup";

/**
 * Unpublishes an English article and all of its generated language variants
 * together. Each published version is retained as a draft, matching Sanity's
 * native unpublish behaviour while preventing stale translated pages online.
 */
export const UnpublishPostWithTranslationsAction: DocumentActionComponent = (
  props,
) => {
  const client = useClient({apiVersion: "2026-07-24"});
  const toast = useToast();
  const isPublished = Boolean(props.published);

  const handle = useCallback(async () => {
    if (!isPublished) return;

    const currentTitle = String(
      (props.draft ?? props.published)?.title ?? "这篇文章",
    );
    if (!globalThis.confirm(`确定取消发布“${currentTitle}”及其自动译文吗？所有内容会保留为草稿。`)) {
      return;
    }

    try {
      const group = await getTranslationGroup(client, props.id);
      const ids = group.documentIds;
      const documents = await client.fetch<SanityDocumentLike[]>(
        "*[_id in $ids || _id in $draftIds]",
        {ids, draftIds: ids.map(draftId)},
      );
      const byId = new Map(documents.map((document) => [document._id, document]));
      let transaction = client.transaction();

      for (const id of ids) {
        const published = byId.get(id);
        const draft = byId.get(draftId(id));
        if (published && !draft) {
          transaction = transaction.create(documentForDraft(published, draftId(id)));
        }
        if (published) transaction = transaction.delete(id);
      }

      await transaction.commit();
      toast.push({
        status: "success",
        title: "已取消发布",
        description: `文章及 ${Math.max(0, ids.length - 1)} 个译文已保留为草稿。`,
      });
      props.onComplete();
    } catch (error) {
      toast.push({
        status: "error",
        title: "取消发布失败",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [client, isPublished, props, toast]);

  return {
    label: "取消发布（含译文）",
    disabled: !isPublished,
    onHandle: () => void handle(),
  };
};

UnpublishPostWithTranslationsAction.action = "unpublish";
