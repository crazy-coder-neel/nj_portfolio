/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // Static Next.js pages require inline hydration scripts; GSAP uses inline styles.
        // The production policy does not permit eval or arbitrary external scripts.
        ...(process.env.NODE_ENV === 'production' ? [{
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
        }] : []),
      ],
    }]
  },
}

export default nextConfig
