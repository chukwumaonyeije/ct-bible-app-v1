
import { generateSW } from 'workbox-build';

await generateSW({
  swDest: 'service-worker.js',
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,svg,webmanifest}'],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: ({url}) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate'
    }
  ]
});
console.log('Service worker generated.');
