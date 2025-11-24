import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
  noindex?: boolean
}

export default function SEO({
  title = 'Kesti Pro - نظام نقاط البيع الأول في تونس | POS System Tunisia',
  description = 'نظام Kesti Pro الاحترافي لإدارة المبيعات والمخزون في تونس. POS System متكامل للمحلات التجارية، المطاعم، والصيدليات. نظام كاشير ذكي، تقارير مفصلة، إدارة المخزون التلقائية. جرّب مجاناً 15 يوم!',
  keywords = 'نظام نقاط البيع تونس, POS System Tunisia, Kesti Pro, KestiPro, Kesti TN, نظام كاشير تونس, برنامج محاسبة تونس, إدارة المبيعات تونس, نظام المخزون تونس, Point of Sale Tunisia, Caisse Enregistreuse Tunisie, logiciel de gestion Tunisie, système de caisse Tunisie, gestion stock Tunisie, kesti, kestipro.com, pos tunisia, cashier system tunisia, retail management tunisia',
  ogImage = '/logo/KESTi.png',
  ogType = 'website',
  canonicalUrl,
  noindex = false
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kestipro.com'
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Kesti Pro" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}
      
      {/* Language & Region */}
      <meta httpEquiv="content-language" content="ar" />
      <meta name="language" content="Arabic" />
      <meta name="geo.region" content="TN" />
      <meta name="geo.placename" content="Tunisia" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ar_TN" />
      <meta property="og:site_name" content="Kesti Pro" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Additional Meta Tags for Better Ranking */}
      <meta name="theme-color" content="#6FC605" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Kesti Pro',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Windows, Mac, Linux, iOS, Android',
            offers: {
              '@type': 'Offer',
              price: '30',
              priceCurrency: 'TND',
              availability: 'https://schema.org/InStock'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '50'
            },
            description: description,
            url: siteUrl,
            author: {
              '@type': 'Organization',
              name: 'Kesti Pro',
              url: siteUrl,
              logo: `${siteUrl}/logo/KESTi.png`,
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'TN',
                addressRegion: 'Tunisia'
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+216-53518337',
                contactType: 'Customer Service',
                availableLanguage: ['Arabic', 'French']
              }
            }
          })
        }}
      />
    </Head>
  )
}
