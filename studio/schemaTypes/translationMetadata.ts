import {defineArrayMember, defineField, defineType} from "sanity";
import {LOCALIZED_DOCUMENT_TYPES} from "../config/i18n";

/**
 * Compatibility schema for translation records that are maintained by the
 * server-side translation workflow. It intentionally has no desk entry: it
 * prevents legacy metadata records from causing a "schema type not found"
 * error, without exposing translations as extra documents to operators.
 */
export const translationMetadata = defineType({
  name: "translation.metadata",
  title: "Translation metadata (system)",
  type: "document",
  fields: [
    defineField({
      name: "translations",
      title: "Translations",
      type: "array",
      of: [
        defineArrayMember({
          name: "translationReference",
          type: "object",
          fields: [
            defineField({
              name: "value",
              title: "Document",
              type: "reference",
              weak: true,
              to: LOCALIZED_DOCUMENT_TYPES.map((type) => ({type})),
            }),
          ],
          preview: {
            select: {title: "value.title", subtitle: "value.language"},
          },
        }),
      ],
      readOnly: true,
      hidden: true,
    }),
  ],
});
