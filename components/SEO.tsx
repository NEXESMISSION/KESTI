import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
  noindex?: boolean
  pageType?: 'home' | 'product' | 'article' | 'faq' | 'contact'
}

// Comprehensive keywords for maximum search engine visibility
const FULL_KEYWORDS = `
kesti, KESTI, KestiPro, Kesti Pro, kestipro, kestipro.com, kesti tunisia, kesti tn, kesti تونس,
نظام نقاط البيع تونس, POS System Tunisia, Kesti TN, نظام كاشير تونس, برنامج محاسبة تونس,
إدارة المبيعات تونس, نظام المخزون تونس, Point of Sale Tunisia, Caisse Enregistreuse Tunisie,
logiciel de gestion Tunisie, système de caisse Tunisie, gestion stock Tunisie, pos tunisia,
cashier system tunisia, retail management tunisia, kesti pos, kesti system, كيستي, كيستي برو,
برنامج كاشير, برنامج محل, نظام محل تجاري, برنامج سوبرماركت, برنامج صيدلية, برنامج مطعم,
logiciel caisse tunisie, logiciel pharmacie tunisie, logiciel restaurant tunisie,
inventory management tunisia, stock management tunisia, sales tracking tunisia,
برنامج تتبع المبيعات, برنامج ادارة المخزون, نظام الفواتير تونس, برنامج الفواتير,
point de vente tunisie, terminal de paiement tunisie, gestion commerciale tunisie,
best pos system tunisia, افضل برنامج كاشير تونس, افضل نظام نقاط البيع,
cloud pos tunisia, online pos tunisia, web pos tunisia, mobile pos tunisia,
نظام نقاط البيع السحابي, كاشير اونلاين, برنامج كاشير موبايل,
small business software tunisia, برنامج المحلات الصغيرة, logiciel petite entreprise tunisie,
retail pos tunisia, restaurant pos tunisia, pharmacy pos tunisia,
كيستي برو تونس, Kesti Pro Tunisie, Kesti Pro Tunisia, kesti pro tn,
نظام كيستي, système kesti, kesti system tunisia, تطبيق كيستي,
free pos trial tunisia, تجربة مجانية نظام كاشير, essai gratuit caisse tunisie,
30 دينار شهريا, 30 tnd pos, affordable pos tunisia, نظام كاشير رخيص تونس
`.trim().replace(/\n/g, ', ')

// Long-form description for better SEO
const FULL_DESCRIPTION = `
Kesti Pro (كيستي برو) هو نظام نقاط البيع الاحترافي الأول في تونس لإدارة المبيعات والمخزون. 
يعمل على جميع الأجهزة (هاتف، تابلت، كمبيوتر) بدون تثبيت. 
مميزات: تسجيل مبيعات سريع، مسح باركود بالكاميرا، تتبع المخزون، حساب الأرباح، تقارير مفصلة، إدارة الموظفين، دعم فروع متعددة. 
مثالي للسوبرماركت، الصيدليات، المطاعم، محلات الملابس. 
السعر: 30 دينار/شهر فقط. تجربة مجانية 15 يوم. 
Kesti Pro - POS System Tunisia | Point of Sale | Caisse Enregistreuse Tunisie.
`.trim().replace(/\n/g, ' ')

export default function SEO({
  title = 'Kesti Pro - نظام نقاط البيع الأول في تونس | POS System Tunisia | Caisse Tunisie',
  description = FULL_DESCRIPTION,
  keywords = FULL_KEYWORDS,
  ogImage = '/logo/KESTi.png',
  ogType = 'website',
  canonicalUrl,
  noindex = false,
  pageType = 'home'
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kestipro.com'
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl
  const currentYear = new Date().getFullYear()

  // FAQ Schema for better search visibility
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Kesti Pro? / ما هو كيستي برو؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kesti Pro is Tunisia\'s leading cloud-based Point of Sale (POS) system for managing sales, inventory, and business operations. It works on any device (phone, tablet, computer) and costs only 30 TND/month. كيستي برو هو نظام نقاط البيع السحابي الرائد في تونس لإدارة المبيعات والمخزون.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does Kesti Pro cost? / كم يكلف كيستي برو؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kesti Pro costs only 30 TND per month for unlimited features, devices, and users. We offer a free 15-day trial with no credit card required. كيستي برو يكلف فقط 30 دينار شهرياً مع تجربة مجانية 15 يوم.'
        }
      },
      {
        '@type': 'Question',
        name: 'What devices does Kesti Pro work on? / على أي أجهزة يعمل كيستي برو؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kesti Pro works on any device with a web browser - smartphones (Android/iPhone), tablets, laptops, and desktop computers. No installation required. يعمل على جميع الأجهزة بدون تثبيت.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is Kesti Pro available in Tunisia? / هل كيستي برو متوفر في تونس؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Kesti Pro is specifically designed for Tunisian businesses with Arabic interface, TND currency, and local payment methods. Support available in Arabic and French. نعم! كيستي برو مصمم خصيصاً للشركات التونسية.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does Kesti Pro have a free trial? / هل يوجد تجربة مجانية؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Kesti Pro offers a completely free 15-day trial with all features. No credit card required. We also help add your products for free. نعم، نقدم تجربة مجانية 15 يوم بكل الميزات بدون بطاقة بنكية.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I use Kesti Pro for my supermarket/pharmacy/restaurant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Kesti Pro is perfect for supermarkets, pharmacies, restaurants, cafés, clothing stores, electronics shops, and any retail business in Tunisia.'
        }
      }
    ]
  }

  // WebSite Schema for Bing and Google
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kesti Pro',
    alternateName: ['Kesti', 'KestiPro', 'كيستي برو', 'كيستي', 'Kesti Tunisia', 'Kesti TN'],
    url: siteUrl,
    description: 'Tunisia\'s leading POS system for sales and inventory management. نظام نقاط البيع الأول في تونس.',
    inLanguage: ['ar', 'fr', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }

  // Organization Schema (enhanced)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Kesti Pro',
    legalName: 'Kesti Pro',
    alternateName: ['Kesti', 'KestiPro', 'كيستي برو', 'كيستي', 'Kesti Tunisia'],
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${siteUrl}/#logo`,
      url: `${siteUrl}/logo/KESTi.png`,
      contentUrl: `${siteUrl}/logo/KESTi.png`,
      width: 512,
      height: 512,
      caption: 'Kesti Pro - نظام نقاط البيع في تونس'
    },
    image: `${siteUrl}/logo/KESTi.png`,
    description: description,
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TN',
      addressRegion: 'Tunisia'
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+216-53518337',
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'French', 'English'],
        areaServed: 'TN'
      },
      {
        '@type': 'ContactPoint',
        telephone: '+216-53518337',
        contactType: 'sales',
        availableLanguage: ['Arabic', 'French'],
        areaServed: 'TN'
      },
      {
        '@type': 'ContactPoint',
        telephone: '+216-53518337',
        contactType: 'technical support',
        availableLanguage: ['Arabic', 'French'],
        areaServed: 'TN'
      }
    ],
    sameAs: [
      'https://kestipro.com',
      'https://www.kestipro.com',
      'https://www.facebook.com/profile.php?id=61581670844981',
      'https://www.instagram.com/kesti_tn'
    ],
    knowsAbout: [
      'Point of Sale Systems',
      'POS Software',
      'Inventory Management',
      'Sales Management',
      'Business Software',
      'Retail Technology',
      'نظام نقاط البيع',
      'إدارة المخزون',
      'برنامج كاشير'
    ]
  }

  // Software Application Schema (enhanced)
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${siteUrl}/#software`,
    name: 'Kesti Pro',
    alternateName: ['Kesti', 'KestiPro', 'كيستي برو', 'نظام كيستي'],
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Point of Sale Software',
    operatingSystem: 'Web Browser (Chrome, Firefox, Safari, Edge), Windows, Mac, Linux, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '30',
      priceCurrency: 'TND',
      priceValidUntil: `${currentYear + 1}-12-31`,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Kesti Pro'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '127',
      reviewCount: '89'
    },
    description: description,
    url: siteUrl,
    downloadUrl: `${siteUrl}/signup`,
    installUrl: `${siteUrl}/signup`,
    screenshot: `${siteUrl}/logo/KESTi.png`,
    softwareVersion: '2.0',
    releaseNotes: 'Latest version with enhanced inventory management and multi-location support.',
    featureList: [
      'Point of Sale (POS)',
      'Inventory Management',
      'Sales Tracking',
      'Financial Reports',
      'Employee Management',
      'Multi-device Support',
      'Multi-location Support',
      'Barcode Scanning',
      'WhatsApp Receipts',
      'Expense Tracking',
      'Profit Calculation',
      'Cloud-based'
    ],
    author: {
      '@type': 'Organization',
      name: 'Kesti Pro',
      url: siteUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kesti Pro',
      url: siteUrl
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: ['ar', 'fr', 'en'],
    countriesSupported: 'TN',
    availableOnDevice: ['Desktop', 'Mobile', 'Tablet']
  }

  // Product Schema for e-commerce visibility
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Kesti Pro - POS System',
    description: 'Professional Point of Sale system for Tunisian businesses. Manage sales, inventory, and finances from any device.',
    brand: {
      '@type': 'Brand',
      name: 'Kesti Pro'
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/signup`,
      priceCurrency: 'TND',
      price: '30',
      priceValidUntil: `${currentYear + 1}-12-31`,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Kesti Pro'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '89'
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'أحمد الزغلامي'
        },
        reviewBody: 'كنت أضيع 3 ساعات كل ليلة في الحسابات. الآن أعرف كل شيء في ثانية واحدة.'
      },
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: 'فاطمة بن عمر'
        },
        reviewBody: 'اكتشفت أن 15% من المبيعات كانت تضيع. الآن كل قرش تحت السيطرة.'
      }
    ]
  }

  // Local Business Schema for local search
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#localbusiness`,
    name: 'Kesti Pro',
    description: 'Professional POS and business management software provider in Tunisia.',
    url: siteUrl,
    telephone: '+216-53518337',
    email: 'support@kestipro.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TN',
      addressRegion: 'Tunisia'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '36.8065',
      longitude: '10.1815'
    },
    areaServed: {
      '@type': 'Country',
      name: 'Tunisia'
    },
    priceRange: '30 TND/month',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '20:00'
    }
  }

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Kesti Pro" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="revisit-after" content="1 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="ar" href={fullCanonicalUrl} />
      <link rel="alternate" hrefLang="fr" href={fullCanonicalUrl} />
      <link rel="alternate" hrefLang="en" href={fullCanonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullCanonicalUrl} />
      
      {/* Robots & Crawlers */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}
      
      {/* Search Engine Verification - Add your verification codes */}
      {/* <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" /> */}
      <meta name="msvalidate.01" content="FE45875844F1249207E9886A6DC434D1" />
      {/* <meta name="yandex-verification" content="YOUR_YANDEX_VERIFICATION_CODE" /> */}
      
      {/* Language & Region */}
      <meta httpEquiv="content-language" content="ar, fr, en" />
      <meta name="language" content="Arabic, French, English" />
      <meta name="geo.region" content="TN" />
      <meta name="geo.placename" content="Tunisia" />
      <meta name="geo.position" content="36.8065;10.1815" />
      <meta name="ICBM" content="36.8065, 10.1815" />
      
      {/* Dublin Core Metadata for Bing */}
      <meta name="DC.title" content={title} />
      <meta name="DC.creator" content="Kesti Pro" />
      <meta name="DC.subject" content="POS System, Point of Sale, نظام نقاط البيع" />
      <meta name="DC.description" content={description} />
      <meta name="DC.publisher" content="Kesti Pro" />
      <meta name="DC.type" content="Software" />
      <meta name="DC.format" content="text/html" />
      <meta name="DC.language" content="ar" />
      <meta name="DC.coverage" content="Tunisia" />
      
      {/* Open Graph / Facebook - Enhanced */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:secure_url" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Kesti Pro - نظام نقاط البيع الأول في تونس | Tunisia's #1 POS System" />
      <meta property="og:locale" content="ar_TN" />
      <meta property="og:locale:alternate" content="fr_TN" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:site_name" content="Kesti Pro" />
      <meta property="og:see_also" content="https://www.facebook.com/profile.php?id=61581670844981" />
      <meta property="og:see_also" content="https://www.instagram.com/kesti_tn" />
      
      {/* Twitter Card - Enhanced */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@kesti_tn" />
      <meta name="twitter:creator" content="@kesti_tn" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:image:alt" content="Kesti Pro - نظام نقاط البيع في تونس" />
      
      {/* Microsoft/Bing Specific */}
      <meta name="msapplication-TileColor" content="#6FC605" />
      <meta name="msapplication-TileImage" content={`${siteUrl}/logo/KESTi.png`} />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-tooltip" content="Kesti Pro - POS System Tunisia" />
      <meta name="msapplication-starturl" content={siteUrl} />
      
      {/* Apple/iOS */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Kesti Pro" />
      <link rel="apple-touch-icon" href={`${siteUrl}/logo/KESTi.png`} />
      
      {/* Theme & Colors */}
      <meta name="theme-color" content="#6FC605" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data - WebSite (for Bing & Google site search) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      {/* Structured Data - Software Application */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      
      {/* Structured Data - Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      {/* Structured Data - FAQ (Great for Bing & Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* Structured Data - Local Business */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: siteUrl
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Kesti Pro',
                item: `${siteUrl}/`
              }
            ]
          })
        }}
      />
    </Head>
  )
}
