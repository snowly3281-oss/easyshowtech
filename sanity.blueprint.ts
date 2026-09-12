import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'translate-published-content',
      timeout: 300,
      event: {
        on: ['create', 'update'],
        filter:
          '(_type in ["home","sitePage","oem","series","equipment","product","solution","post","postCategory","postTag"] && coalesce(language, "en") == "en" && !(_id in path("drafts.**"))) || (_type == "translationJob" && status == "pending")',
        projection:
          '{_id, _type, _rev, language, sourceId, status, targetLanguages}',
        resource: {
          type: 'dataset',
          id: 'p3d22f8w.production',
        },
      },
    }),
  ],
})
