import { MetadataRoute } from 'next'

export const dynamic = "force-static"
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '*?handoff=',
                '*?handoff_ref=',
                '/*/all-tools?search=',
                '/*/all-tools?category=',
                '/*/all-tools?execution=',
                '/*/all-tools?family=',
                '/*/all-tools?input=',
                '/*/all-tools?tag=',
                '/*/all-tools?tags=',
                '/*/all-tools?capability=',
                '/*/all-tools?use=',
                '/*/all-tools?useCase=',
            ],
        },
        sitemap: 'https://byteflow.tools/sitemap.xml',
    }
}
