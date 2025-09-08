module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // ✅ include only the Expo preset
    plugins: ["react-native-worklets/plugin"],
  };
};
