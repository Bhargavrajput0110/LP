const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['d:/LP/WorkGradient.jsx'],
  bundle: true,
  minify: true,
  outfile: 'd:/LP/work-gradient-bundle.js',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
  },
}).catch(() => process.exit(1));
