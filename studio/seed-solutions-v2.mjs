/**
 * Seed 6 main solution pages for Easyshow independent website
 * Run: node --env-file=studio/.env studio/seed-solutions-v2.mjs
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'p3d22f8w',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-10-01',
  useCdn: false,
})

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN (studio/.env).')
  process.exit(1)
}

const span = (t, k) => ({ _type: 'span', _key: k, text: t, marks: [] })
const para = (t, k) => ({ _type: 'block', _key: k, style: 'normal', markDefs: [], children: [span(t, `${k}c`)] })
const cta = (label, slug) => ({ _type: 'ctaLink', label, reference: { _type: 'reference', _ref: slug } })

// Product references - will be created by seed-products-v2.mjs
const productRefs = {
  'product-aluminum-backdrop-frame': 'product-aluminum-backdrop-frame',
  'product-custom-printed-backdrop': 'product-custom-printed-backdrop',
  'product-pop-up-display': 'product-pop-up-display',
  'product-event-tent': 'product-event-tent',
  'product-photo-booth': 'product-photo-booth',
  'product-flower-wall': 'product-flower-wall',
  'product-replacement-fabrics': 'product-replacement-fabrics',
  'product-heat-press-printer': 'product-heat-press-printer',
}

// 6 application scenarios (solutions)
const solutions = [
  {
    _type: 'solution',
    _id: 'solution-wedding-party',
    title: '婚礼派对解决方案',
    slug: { _type: 'slug', current: 'wedding-party' },
    language: 'en',
    audience: ['wholesale', 'custom'],
    status: 'published',
    summary: [
      para('Create unforgettable wedding celebrations with our comprehensive event solutions. From elegant backdrop setups to instant photo booths, we provide everything needed for picture-perfect moments.', 'summary')
    ],
    configurationIntro: [
      para('Our wedding solutions are designed to transform any venue into a magical celebration space. Choose from our curated packages or customize every detail to match your wedding theme.', 'config')
    ],
    pageBuilder: [
      {
        _type: 'hero',
        _key: 'hero1',
        heading: '梦幻婚礼，从 Easyshow 开始',
        subheading: '专业婚礼活动设备解决方案',
        backgroundImage: { _type: 'image', asset: { _ref: 'image-wedding-hero' } },
      },
      {
        _type: 'productHighlight',
        _key: 'ph1',
        heading: '核心产品',
        products: [
          { _type: 'reference', _ref: productRefs['product-aluminum-backdrop-frame'] },
          { _type: 'reference', _ref: productRefs['product-flower-wall'] },
          { _type: 'reference', _ref: productRefs['product-photo-booth'] },
        ],
      },
      {
        _type: 'featureGrid',
        _key: 'fg1',
        heading: '为什么选择我们的婚礼设备?',
        features: [
          { title: '快速搭建', description: '模块化设计，5-10分钟完成搭建', icon: 'clock' },
          { title: '专业品质', description: '高规格材料，确保演出效果', icon: 'star' },
          { title: '定制服务', description: '可根据婚礼主题定制设计', icon: 'palette' },
          { title: '一站式采购', description: '所有设备一站购齐，省心省力', icon: 'package' },
        ],
      },
      {
        _type: 'ctaSection',
        _key: 'cta1',
        heading: '准备好打造梦幻婚礼了吗?',
        ctas: [
          cta('获取报价', 'contact'),
          cta('查看产品', 'products'),
        ],
      },
    ],
    order: 1,
  },
  {
    _type: 'solution',
    _id: 'solution-corporate-events',
    title: '企业活动展览解决方案',
    slug: { _type: 'slug', current: 'corporate-events' },
    language: 'en',
    audience: ['wholesale', 'custom'],
    status: 'published',
    summary: [
      para('Elevate your corporate events with professional display solutions. Trade shows, conferences, product launches - we deliver impact.', 'summary')
    ],
    configurationIntro: [
      para('Our corporate event solutions help businesses make a lasting impression. From eye-catching pop-up displays to professional booth structures, every element is designed for maximum brand visibility.', 'config')
    ],
    pageBuilder: [
      {
        _type: 'hero',
        _key: 'hero2',
        heading: '企业活动专业展示解决方案',
        subheading: '让您的品牌在展会中脱颖而出',
        backgroundImage: { _type: 'image', asset: { _ref: 'image-corporate-hero' } },
      },
      {
        _type: 'productHighlight',
        _key: 'ph2',
        heading: '核心产品',
        products: [
          { _type: 'reference', _ref: productRefs['product-pop-up-display'] },
          { _type: 'reference', _ref: productRefs['product-event-tent'] },
          { _type: 'reference', _ref: productRefs['product-custom-printed-backdrop'] },
        ],
      },
      {
        _type: 'featureGrid',
        _key: 'fg2',
        heading: '企业活动设备优势',
        features: [
          { title: '品牌展示', description: '高画质印刷，展现品牌形象', icon: 'badge' },
          { title: '便携性', description: '轻便设计，运输搭建都方便', icon: 'truck' },
          { title: '重复使用', description: '可更换画面，降低单次成本', icon: 'refresh' },
          { title: '全球发货', description: '专业物流，覆盖国际展会', icon: 'globe' },
        ],
      },
      {
        _type: 'ctaSection',
        _key: 'cta2',
        heading: '提升您的企业活动效果',
        ctas: [
          cta('获取报价', 'contact'),
          cta('查看产品', 'products'),
        ],
      },
    ],
    order: 2,
  },
  {
    _type: 'solution',
    _id: 'solution-photography-film',
    title: '摄影影视解决方案',
    slug: { _type: 'slug', current: 'photography-film' },
    language: 'en',
    audience: ['wholesale', 'custom'],
    status: 'published',
    summary: [
      para('Professional backdrop and lighting solutions for photographers and filmmakers. Studio-quality equipment for perfect shots every time.', 'summary')
    ],
    configurationIntro: [
      para('Our photography solutions are trusted by professionals worldwide. Whether you need a permanent studio setup or portable gear for on-location shoots, we have you covered.', 'config')
    ],
    pageBuilder: [
      {
        _type: 'hero',
        _key: 'hero3',
        heading: '专业摄影影视设备',
        subheading: '打造完美拍摄环境',
        backgroundImage: { _type: 'image', asset: { _ref: 'image-photo-hero' } },
      },
      {
        _type: 'productHighlight',
        _key: 'ph3',
        heading: '核心产品',
        products: [
          { _type: 'reference', _ref: productRefs['product-aluminum-backdrop-frame'] },
          { _type: 'reference', _ref: productRefs['product-custom-printed-backdrop'] },
          { _type: 'reference', _ref: productRefs['product-heat-press-printer'] },
        ],
      },
      {
        _type: 'featureGrid',
        _key: 'fg3',
        heading: '摄影设备特点',
        features: [
          { title: '专业品质', description: '色准高，还原真实色彩', icon: 'camera' },
          { title: '多样背景', description: '数百种背景布可选', icon: 'images' },
          { title: '快速更换', description: '挂钩系统，背景切换便捷', icon: 'zap' },
          { title: 'OEM 定制', description: '可印制专属背景布', icon: 'edit' },
        ],
      },
      {
        _type: 'ctaSection',
        _key: 'cta3',
        heading: '升级您的摄影工作室',
        ctas: [
          cta('获取报价', 'contact'),
          cta('查看产品', 'products'),
        ],
      },
    ],
    order: 3,
  },
  {
    _type: 'solution',
    _id: 'solution-retail-popup',
    title: '零售快闪店解决方案',
    slug: { _type: 'slug', current: 'retail-popup' },
    language: 'en',
    audience: ['wholesale', 'custom'],
    status: 'published',
    summary: [
      para('Create engaging retail experiences with our pop-up store solutions. Perfect for brand activations, seasonal sales, and experiential marketing.', 'summary')
    ],
    configurationIntro: [
      para('Our retail solutions help brands create memorable shopping experiences. From eye-catching tent structures to customizable displays, every element is designed to drive customer engagement.', 'config')
    ],
    pageBuilder: [
      {
        _type: 'hero',
        _key: 'hero4',
        heading: '零售快闪店解决方案',
        subheading: '打造引人入胜的购物体验',
        backgroundImage: { _type: 'image', asset: { _ref: 'image-retail-hero' } },
      },
      {
        _type: 'productHighlight',
        _key: 'ph4',
        heading: '核心产品',
        products: [
          { _type: 'reference', _ref: productRefs['product-event-tent'] },
          { _type: 'reference', _ref: productRefs['product-pop-up-display'] },
          { _type: 'reference', _ref: productRefs['product-custom-printed-backdrop'] },
        ],
      },
      {
        _type: 'featureGrid',
        _key: 'fg4',
        heading: '零售快闪店优势',
        features: [
          { title: '快速部署', description: '当天搭建，当天营业', icon: 'rocket' },
          { title: '灵活尺寸', description: '可根据场地定制尺寸', icon: 'maximize' },
          { title: '品牌突出', description: '全画面印刷，最大化品牌曝光', icon: 'megaphone' },
          { title: '成本效益', description: '相比实体店大幅降低成本', icon: 'dollar-sign' },
        ],
      },
      {
        _type: 'ctaSection',
        _key: 'cta4',
        heading: '开启您的快闪店之旅',
        ctas: [
          cta('获取报价', 'contact'),
          cta('查看产品', 'products'),
        ],
      },
    ],
    order: 4,
  },
  {
    _type: 'solution',
    _id: 'solution-religious-community',
    title: '宗教社区活动解决方案',
    slug: { _type: 'slug', current: 'religious-community' },
    language: 'en',
    audience: ['wholesale', 'custom'],
    status: 'published',
    summary: [
      para('Provide sacred and welcoming spaces for religious gatherings and community events. Reliable equipment for churches, mosques, temples, and community centers.', 'summary')
    ],
    configurationIntro: [
      para('Our community event solutions help create meaningful gathering spaces. From religious ceremonies to community celebrations, we provide equipment that enhances the experience while remaining respectful and dignified.', 'config')
    ],
    pageBuilder: [
      {
        _type: 'hero',
        _key: 'hero5',
        heading: '宗教社区活动解决方案',
        subheading: '营造庄重温馨的聚会空间',
        backgroundImage: { _type: 'image', asset: { _ref: 'image-religious-hero' } },
      },
      {
        _type: 'productHighlight',
        _key: 'ph5',
        heading: '核心产品',
        products: [
          { _type: 'reference', _ref: productRefs['product-aluminum-backdrop-frame'] },
          { _type: 'reference', _ref: productRefs['product-event-tent'] },
          { _type: 'reference', _ref: productRefs['product-flower-wall'] },
        ],
      },
      {
        _type: 'featureGrid',
        _key: 'fg5',
        heading: '社区活动设备特点',
        features: [
          { title: '庄重设计', description: '专业简洁，适合宗教场合', icon: 'heart' },
          { title: '大容量', description: '可容纳大规模聚会', icon: 'users' },
          { title: '多功能', description: '适用于各类社区活动', icon: 'grid' },
          { title: '经济实惠', description: '性价比高，适合非营利组织', icon: 'gift' },
        ],
      },
      {
        _type: 'ctaSection',
        _key: 'cta5',
        heading: '联系我们获取专属方案',
        ctas: [
          cta('获取报价', 'contact'),
          cta('查看产品', 'products'),
        ],
      },
    ],
    order: 5,
  },
  {
    _type: 'solution',
    _id: 'solution-education-training',
    title: '教育培训解决方案',
    slug: { _type: 'slug', current: 'education-training' },
    language: 'en',
    audience: ['wholesale', 'custom'],
    status: 'published',
    summary: [
      para('Create engaging learning environments with our educational display solutions. Perfect for schools, universities, training centers, and corporate training.', 'summary')
    ],
    configurationIntro: [
      para('Our education solutions help create dynamic learning environments. From backdrops for photo sessions to display systems for exhibitions, we help educational institutions showcase achievements and create memorable experiences.', 'config')
    ],
    pageBuilder: [
      {
        _type: 'hero',
        _key: 'hero6',
        heading: '教育培训活动解决方案',
        subheading: '打造生动有趣的学习环境',
        backgroundImage: { _type: 'image', asset: { _ref: 'image-education-hero' } },
      },
      {
        _type: 'productHighlight',
        _key: 'ph6',
        heading: '核心产品',
        products: [
          { _type: 'reference', _ref: productRefs['product-aluminum-backdrop-frame'] },
          { _type: 'reference', _ref: productRefs['product-custom-printed-backdrop'] },
          { _type: 'reference', _ref: productRefs['product-pop-up-display'] },
        ],
      },
      {
        _type: 'featureGrid',
        _key: 'fg6',
        heading: '教育设备优势',
        features: [
          { title: '灵活多用', description: '适用于各类教育活动', icon: 'book-open' },
          { title: '易于操作', description: '老师和学生都能轻松搭建', icon: 'hand' },
          { title: '成本友好', description: '教育机构专属折扣', icon: 'graduation-cap' },
          { title: '持续支持', description: '长期维护和配件供应', icon: 'tool' },
        ],
      },
      {
        _type: 'ctaSection',
        _key: 'cta6',
        heading: '为教育机构提供专业支持',
        ctas: [
          cta('获取报价', 'contact'),
          cta('查看产品', 'products'),
        ],
      },
    ],
    order: 6,
  },
]

async function seedSolutions() {
  console.log('Seeding 6 solution pages...')
  
  for (const solution of solutions) {
    try {
      const result = await client.createOrReplace(solution)
      console.log(`✓ Created/updated: ${solution.title}`)
    } catch (err) {
      console.error(`✗ Failed: ${solution.title}`, err.message)
    }
  }
  
  console.log('\n✅ Solutions seeding complete!')
}

seedSolutions().catch(console.error)
