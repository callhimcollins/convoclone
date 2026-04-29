export default {
  expo: {
    owner: "officialconvo",
    name: "Convo",
    slug: "Convo",
    version: "1.1.5",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "com.social.convo",
    userInterfaceStyle: "automatic",
    updates: {
      url: "https://u.expo.dev/b60a46dc-edcc-4dc8-8288-54c945325f6f"
    },
    runtimeVersion: "1.1.3",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#625FE0"
    },
    ios: {
      runtimeVersion: "1.1.5",
      supportsTablet: true,
      usesAppleSignIn: true,
      infoPlist: {
        UIBackgroundModes: ["audio", "audio"],
        ITSAppUsesNonExemptEncryption: false
      },
      bundleIdentifier: "com.social.convo"
    },
    android: {
      runtimeVersion: "1.1.4",
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#625FE0"
      },
      package: "com.social.convo"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-apple-authentication",
      "@react-native-google-signin/google-signin"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: { origin: false },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      eas: {
        "owner": "officialconvo",
        "projectId": "b60a46dc-edcc-4dc8-8288-54c945325f6f"      
      }
    }
  }
}