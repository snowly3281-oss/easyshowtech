import {useToast} from "@sanity/ui";
import {
  type DocumentActionComponent,
  type DocumentActionProps,
  useDocumentOperation,
} from "sanity";

/**
 * Publishing and translating are intentionally decoupled.
 *
 * The publish mutation is the single source of truth. The deployed Sanity
 * Function receives that mutation and uses its server-only DeepSeek secret to
 * update ES/FR/DE/IT. Keeping model calls out of Studio prevents duplicated
 * translations, quota usage and API keys leaking into the browser.
 */
export const PublishAndTranslateAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const toast = useToast();
  const {publish} = useDocumentOperation(props.id, props.type);
  const currentDocument = props.draft ?? props.published;
  const isEnglish = (currentDocument?.language ?? "en") === "en";

  return {
    label: isEnglish ? "发布英文并后台同步四语" : "发布译文",
    disabled: Boolean(publish.disabled),
    tone: "positive",
    onHandle: () => {
      publish.execute();
      if (isEnglish) {
        toast.push({
          status: "success",
          title: "英文已提交发布",
          description:
            "DeepSeek 会在后台同步 ES / FR / DE / IT；无需停留在本页面等待。",
        });
      }
      props.onComplete();
    },
  };
};

PublishAndTranslateAction.action = "publish";
