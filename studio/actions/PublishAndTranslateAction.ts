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
        window.alert("英文已提交发布，DeepSeek 会在后台同步 ES / FR / DE / IT");
        console.log("英文已提交发布，DeepSeek 会在后台同步 ES / FR / DE / IT");
      }
      props.onComplete();
    },
  };
};

PublishAndTranslateAction.action = "publish";
