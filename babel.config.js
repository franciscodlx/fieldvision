module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['./'],
      alias: {
        '@modules': './src/modules',
        '@shared': './src/shared',
        '@navigation': './src/navigation',
        '@specs': './src/specs',
      },
    }],
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
  ],
};
