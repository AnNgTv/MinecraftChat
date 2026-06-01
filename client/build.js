import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: 'dist/bundle.js',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
    },
  });
  console.log('Build complete!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
