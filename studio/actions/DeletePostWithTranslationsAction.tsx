import {useCallback} from "react";
import {useToast} from "@sanity/ui";
import {type DocumentActionComponent, useClient} from "sanity";
import {getTranslationGroup, draftId} from "./translationGroup";

/**
 * Deleting an article is a complete editorial deletion: source, translated
 * variants, working drafts, and the invisible metadata index are removed in
 * one transaction. This prevents deleted English content surviving at /es,
 * /fr, /de or /it routes.
 */
export const DeletePostWithTranslationsAction: DocumentActionComponent = (
  props,
) => {
  const client = useClient({apiVersion: "2026-07-24"});
  const toast = useToast();
  const canDelete = Boolean(props.draft ?? props.published);

  const handle = useCallback(async () => {
    if (!canDelete) return;

    const currentTitle = String(
      (props.draft ?? props.published)?.title ?? "这篇文章",
    );
    if (!globalThis.confirm(`永久删除“${currentTitle}”及其自动译文吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const group = await getTranslationGroup(client, props.id);
      let transaction = client.transaction();

      for (const id of group.documentIds) {
        transaction = transaction.delete(id).delete(draftId(id));
      }
      if (group.metadataId) {
        transaction = transaction
          .delete(group.metadataId)
          .delete(draftId(group.metadataId));
      }

      await transaction.commit();
      toast.push({
        status: "success",
        title: "文章已删除",
        description: `已同时清理 ${Math.max(0, group.documentIds.length - 1)} 个译文。`,
      });
      props.onComplete();
    } catch (error) {
      toast.push({
        status: "error",
        title: "删除失败",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [canDelete, client, props, toast]);

  return {
    label: "永久删除（含译文）",
    disabled: !canDelete,
    tone: "critical",
    onHandle: () => void handle(),
  };
};

DeletePostWithTranslationsAction.action = "delete";
