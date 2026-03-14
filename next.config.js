const { i18n } = require('./next-i18next.config');

const temporeryUrlsForDevelopment = [
  'replicate.delivery', // logo
  'digitalcdn.max.co.il',
  'digital.isracard.co.il',
  'encrypted-tbn0.gstatic.com',
  'www.shutterstock.com',
  'www.gcenter.co.il',
  'www.countryandtownhouse.com',
  'www.gov.il',
  'dallal.co.il',
  'www.mishpahool.co.il',
  'p1.hiclipart.com',
  'banner2.cleanpng.com',
  'res.cloudinary.com',
  'serviced.co.il',
  'upload.wikimedia.org',
  'cache.bankleumi.co.il',
  'hotcinema.co.il',
  'www.hotcinema.co.il',
  'www.icoupons.co.il',
  'upload.wikimedia.org',
  'play-lh.googleusercontent.com',
  'scontent.fsdv2-1.fna.fbcdn.net',
];
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'picsum.photos',
      'api.dicebear.com',
      'cdn.jsdelivr.net',
      'flagcdn.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'tailwindui.com',
      ...temporeryUrlsForDevelopment,
    ],
  },
};

module.exports = nextConfig;
