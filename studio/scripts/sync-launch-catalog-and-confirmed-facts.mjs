/**
 * Synchronise launch-ready catalog visibility and client-confirmed business facts.
 *
 * Safety:
 * - Dry-run by default; set APPLY=1 to write.
 * - Product visibility is derived from content readiness: a main image and at
 *   least one gallery image are required for the public catalog.
 * - Existing unknown fact fields are preserved.
 * - Every update uses the revision read during planning.
 *
 * Run from the repository root:
 *   node --env-file=studio/.env studio/scripts/sync-launch-catalog-and-confirmed-facts.mjs
 *   APPLY=1 node --env-file=studio/.env studio/scripts/sync-launch-catalog-and-confirmed-facts.mjs
 */
import {createClient} from "@sanity/client";

const PROJECT_ID = "p3d22f8w";
const DATASET = "production";
const API_VERSION = "2026-03-01";
const APPLY = process.env.APPLY === "1";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  throw new Error("SANITY_WRITE_TOKEN missing (studio/.env).");
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
  perspective: "raw",
});

const confirmedAt = "2026-07-26";

function verified(value, evidence, confirmedBy = "甲方资料") {
  return {
    _type: "verifiedValue",
    value,
    confirmed: true,
    evidence,
    confirmedBy,
    confirmedAt,
  };
}

function mergeKeyed(existing = [], updates = []) {
  const updatesByKey = new Map(updates.map((item) => [item._key, item]));
  const preserved = existing.filter((item) => !updatesByKey.has(item?._key));
  return [...preserved, ...updates];
}

async function readPlan() {
  return client.fetch(`{
    "products": *[
      _type == "product" &&
      !(_id in path("drafts.**"))
    ]{
      _id,
      _rev,
      title,
      sku,
      status,
      "hasMainImage": defined(mainImage.asset),
      "galleryCount": coalesce(count(gallery[defined(image.asset)]), 0)
    },
    "about": *[_id == "page-about"][0],
    "factory": *[_id == "page-factory"][0],
    "oem": *[_id == "oem"][0],
    "siteSettings": *[_id == "siteSettings"][0]
  }`);
}

function desiredProductStatus(product) {
  return product.hasMainImage && product.galleryCount > 0
    ? "published"
    : "draft";
}

function buildAboutDocument(existing) {
  const milestones = mergeKeyed(existing?.aboutFacts?.milestones, [
    {
      _type: "verifiedMilestone",
      _key: "confirmed-2015-founded",
      year: "2015",
      title: "Company founded",
      description:
        "Coral established its initial product development and production team.",
      confirmed: true,
      evidence:
        "前期资料收集表格(2).xlsx，公司信息：2015 Establishment。",
    },
    {
      _type: "verifiedMilestone",
      _key: "confirmed-2018-wood",
      year: "2018",
      title: "Wood Pilates equipment production",
      description:
        "Production expanded to wooden Pilates reformer frames and related equipment.",
      confirmed: true,
      evidence:
        "前期资料收集表格(2).xlsx，公司信息：2018 Pilates Wooden Bed Production。",
    },
  ]);

  return {
    ...(existing ?? {
      _id: "page-about",
      _type: "sitePage",
      pageKey: "about",
      route: "/about",
      title: "About Coral Pilates",
    }),
    aboutFacts: {
      ...(existing?.aboutFacts ?? {}),
      yearsManufacturing: verified(
        "10+ years",
        "公司英文简介-修正版.docx：over 10 years of global experience；前期资料收集表格(2).xlsx：2015 founded。",
      ),
      countriesServed: verified(
        "34+ countries",
        "Coral_客户资料补充清单_v4.7.docx，Q8/R24，2026-04-18 已确认。此值覆盖旧资料中的 60+。",
      ),
      factorySize: verified(
        "21,000 m²",
        "前期资料收集表格(2).xlsx，生产信息：工厂面积 21,000 平方米。",
      ),
      productionLines: verified(
        "6 production lines",
        "前期资料收集表格(2).xlsx，生产信息：4 条常规、1 条备用、1 条定制生产线。",
      ),
      annualCapacity: verified(
        "3,800 units/year",
        "前期资料收集表格(2).xlsx，生产信息：产能 3800 pcs/year。未采用 XMind 中冲突的 40,000 units/year。",
      ),
      milestones,
    },
  };
}

function buildFactoryDocument(existing) {
  const manufacturingStages = [
    {
      _type: "factoryStage",
      _key: "stage-01-materials",
      number: "01",
      title: "Select raw materials",
      description:
        "Maple, oak and 7075 aluminium are checked before they enter production.",
      tag: "Materials",
    },
    {
      _type: "factoryStage",
      _key: "stage-02-machining",
      number: "02",
      title: "CNC & laser machining",
      description:
        "Wood and aluminium parts are cut, drilled and positioned to the approved production specification.",
      tag: "Precision",
    },
    {
      _type: "factoryStage",
      _key: "stage-03-bonding",
      number: "03",
      title: "Bonding & joinery",
      description:
        "Wood frames use reinforced mortise-and-tenon joints and durable PVA bonding.",
      tag: "Joinery",
    },
    {
      _type: "factoryStage",
      _key: "stage-04-polishing",
      number: "04",
      title: "Machine & hand polishing",
      description:
        "Surfaces and edges are progressively finished for a smooth, consistent result.",
      tag: "Finishing",
    },
    {
      _type: "factoryStage",
      _key: "stage-05-spraying",
      number: "05",
      title: "Controlled spraying",
      description:
        "Water-based coating is applied in controlled layers to protect and finish the frame.",
      tag: "Coating",
    },
    {
      _type: "factoryStage",
      _key: "stage-06-drying",
      number: "06",
      title: "Drying & treatment",
      description:
        "Frames move through a dust-controlled drying area and the documented UV treatment stage.",
      tag: "Treatment",
    },
    {
      _type: "factoryStage",
      _key: "stage-07-accessories",
      number: "07",
      title: "Accessory preparation",
      description:
        "Springs, wheels, upholstery, rails and hardware are organised and checked before assembly.",
      tag: "Components",
    },
    {
      _type: "factoryStage",
      _key: "stage-08-assembly",
      number: "08",
      title: "Final assembly",
      description:
        "Frames, moving systems and accessories are assembled on dedicated workstations.",
      tag: "Assembly",
    },
    {
      _type: "factoryStage",
      _key: "stage-09-quality",
      number: "09",
      title: "Four-stage quality control",
      description:
        "IQC, IPQC, FQC and OQC checks cover incoming material, production, final function and outgoing condition.",
      tag: "QC",
    },
    {
      _type: "factoryStage",
      _key: "stage-10-packing",
      number: "10",
      title: "Export packing",
      description:
        "Equipment and accessories are counted and protected with export-ready carton and wooden-case packing.",
      tag: "Packing",
    },
    {
      _type: "factoryStage",
      _key: "stage-11-shipping",
      number: "11",
      title: "Shipping handover",
      description:
        "Completed orders move to the shipping area for final handover to the appointed logistics provider.",
      tag: "Shipping",
    },
  ];

  const certifications = mergeKeyed(existing?.factoryFacts?.certifications, [
    {
      _key: "rohs-eleven-01-2026",
      ...verified(
        "RoHS sample compliance — Maple Wood Foldable Reformer, Model Eleven-01",
        "Certificate.pdf：M2603183XY-C0102，Report M2603183XY-R0102，issued 2026-03-16。仅对送检样品负责，不扩写为全系列认证。",
      ),
    },
    {
      _key: "lucid-packaging-2026",
      ...verified(
        "German Packaging Register (LUCID) — DE5777287939103",
        "证书-德国-包装法-珊瑚普拉提(苏州)智能设备有限公司-2026040810041176321.pdf：registered from 2026-04-09；文件列示品牌为 sportspond。",
      ),
    },
  ]);

  return {
    ...(existing ?? {
      _id: "page-factory",
      _type: "sitePage",
      pageKey: "factory",
      route: "/factory",
      title: "Our factory",
    }),
    factoryFacts: {
      ...(existing?.factoryFacts ?? {}),
      floorArea: verified(
        "21,000 m²",
        "前期资料收集表格(2).xlsx，生产信息：工厂面积 21,000 平方米。",
      ),
      teamMembers: verified(
        "94 team members",
        "前期资料收集表格(2).xlsx：业务 11 + 生产 65 + 设计 3 + 开发 4 + 研发 3 + 财务 2 + 质检 6 = 94。",
      ),
      productionLines: verified(
        "6 production lines",
        "前期资料收集表格(2).xlsx：4 条常规、1 条备用、1 条定制生产线。",
      ),
      manufacturingSteps: verified(
        "11 manufacturing steps",
        "Production Process Visualization.xmind：Process 1 raw materials 至 Process 11 shipping；甲方在 2026-07-26 当前沟通中再次确认。",
        "甲方（当前项目沟通）",
      ),
      manufacturingStages,
      cncTolerance: verified(
        "Laser positioning accuracy up to ±0.05 mm",
        "Production Process Visualization.xmind，Process 2：laser positioning accuracy can reach ±0.05 mm；repeat positioning ±0.03 mm。",
      ),
      annualCapacity: verified(
        "3,800 units/year",
        "前期资料收集表格(2).xlsx，生产信息：3800 pcs/year。未采用 XMind 中冲突的 40,000 units/year。",
      ),
      productionTeam: verified(
        "65 production team members",
        "前期资料收集表格(2).xlsx，公司信息：生产部门 65 人。",
      ),
      totalTeam: verified(
        "94 team members",
        "前期资料收集表格(2).xlsx：七个部门人数合计 94。",
      ),
      certifications,
      dedicatedLines: verified(
        "1 custom production line",
        "前期资料收集表格(2).xlsx，生产信息：4 条常规、1 条备用、1 条定制生产线。",
      ),
    },
  };
}

function buildOemDocument(existing) {
  return {
    ...(existing ?? {
      _id: "oem",
      _type: "oem",
      title: "OEM & private label",
    }),
    commercialFacts: {
      ...(existing?.commercialFacts ?? {}),
      standardMoq: verified(
        "OEM available from 1 unit",
        "甲方在 2026-07-26 当前项目沟通中确认：所有 OEM 均可一台起订。",
        "甲方（当前项目沟通）",
      ),
      flexibleMoq: verified(
        "1 unit",
        "甲方在 2026-07-26 当前项目沟通中确认：所有 OEM 均可一台起订。",
        "甲方（当前项目沟通）",
      ),
      certificationScope: verified(
        "RoHS sample compliance: Maple Wood Foldable Reformer, Model Eleven-01",
        "Certificate.pdf：M2603183XY-C0102，issued 2026-03-16。仅限证书列示型号和送检样品。",
      ),
      dedicatedLines: verified(
        "1 custom production line",
        "前期资料收集表格(2).xlsx，生产信息：1 条定制生产线。",
      ),
    },
  };
}

function buildSiteSettingsDocument(existing) {
  return {
    ...(existing ?? {
      _id: "siteSettings",
      _type: "siteSettings",
    }),
    salesEmail: "chris@coralpilates.com",
    companyAddress:
      "Room 102-2, Building 2, Phase I, Taihu Industrial Innovation Incubation & Acceleration Base, No. 2 Fengyuan Road, Xiangshan Subdistrict, Wuzhong District, Suzhou 215100, Jiangsu, China",
  };
}

function addRevisionSafeReplace(transaction, existing, document) {
  if (existing?._rev) {
    const {
      _id: _documentId,
      _type: _documentType,
      _rev: _documentRevision,
      _createdAt: _documentCreatedAt,
      _updatedAt: _documentUpdatedAt,
      ...attributes
    } = document;
    return transaction.patch(document._id, (patch) =>
      patch.ifRevisionId(existing._rev).set(attributes),
    );
  }
  return transaction.create(document);
}

async function main() {
  const plan = await readPlan();
  const productChanges = plan.products
    .map((product) => ({
      ...product,
      desiredStatus: desiredProductStatus(product),
    }))
    .filter((product) => product.status !== product.desiredStatus)
    .sort((a, b) => String(a.sku).localeCompare(String(b.sku)));

  const finalPublished = plan.products.filter(
    (product) => desiredProductStatus(product) === "published",
  );

  console.log(`${APPLY ? "APPLY" : "DRY RUN"} launch catalog + facts sync`);
  console.log(
    `Catalog readiness result: ${finalPublished.length} published / ${plan.products.length} total products`,
  );
  console.log(
    `Status changes: ${productChanges.length} (${productChanges.filter((item) => item.desiredStatus === "published").length} publish, ${productChanges.filter((item) => item.desiredStatus === "draft").length} return to draft)`,
  );
  for (const item of productChanges) {
    console.log(
      `  ${item.status} -> ${item.desiredStatus}  ${item.sku}  ${item.title}  gallery=${item.galleryCount}`,
    );
  }

  const aboutDocument = buildAboutDocument(plan.about);
  const factoryDocument = buildFactoryDocument(plan.factory);
  const oemDocument = buildOemDocument(plan.oem);
  const siteSettingsDocument = buildSiteSettingsDocument(plan.siteSettings);

  console.log("Confirmed-content documents:");
  console.log("  page-about: scale, history and client-approved countries");
  console.log("  page-factory: facility, team, 11 steps and narrow compliance claims");
  console.log("  oem: 1-unit OEM and narrow compliance scope");
  console.log("  siteSettings: sales email and public company address");

  if (!APPLY) {
    console.log("Dry run complete. Re-run with APPLY=1 to commit.");
    return;
  }

  let transaction = client.transaction();

  for (const product of productChanges) {
    transaction = transaction.patch(product._id, (patch) =>
      patch
        .ifRevisionId(product._rev)
        .set({status: product.desiredStatus}),
    );
  }

  transaction = addRevisionSafeReplace(
    transaction,
    plan.about,
    aboutDocument,
  );
  transaction = addRevisionSafeReplace(
    transaction,
    plan.factory,
    factoryDocument,
  );
  transaction = addRevisionSafeReplace(transaction, plan.oem, oemDocument);
  transaction = addRevisionSafeReplace(
    transaction,
    plan.siteSettings,
    siteSettingsDocument,
  );

  const result = await transaction.commit({
    visibility: "sync",
    tag: "coral.launch-catalog-and-confirmed-facts",
  });

  console.log(`Committed transaction ${result.transactionId}.`);

  const verification = await client.fetch(`{
    "publishedProducts": count(*[
      _type == "product" &&
      !(_id in path("drafts.**")) &&
      status == "published"
    ]),
    "publishedSeries": count(*[
      _type == "series" &&
      count(*[
        _type == "product" &&
        !(_id in path("drafts.**")) &&
        status == "published" &&
        references(^._id)
      ]) > 0
    ]),
    "aboutFacts": *[_id == "page-about"][0].aboutFacts,
    "factoryFacts": *[_id == "page-factory"][0].factoryFacts,
    "oemFacts": *[_id == "oem"][0].commercialFacts
  }`);
  console.log(JSON.stringify(verification, null, 2));
}

await main();
