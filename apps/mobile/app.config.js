const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID
    }
  }
};
