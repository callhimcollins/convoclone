export default {
  expo: {
    name: "Convo",
    slug: "Convo",
    version: "1.1.4",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "com.chocolate.convo",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#625FE0"
    },
    ios: {
      supportsTablet: false,
      usesAppleSignIn: true,
      infoPlist: {
        UIBackgroundModes: ["audio"],
        ITSAppUsesNonExemptEncryption: false
      },
      bundleIdentifier: "com.chocolate.convo",
      buildNumber: "22"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#625FE0"
      },
      package: "com.chocolate.convo"
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
      "@react-native-google-signin/google-signin",
      "expo-web-browser",
      [
        "expo-audio",
        {
          microphonePermission:
            "Allow Convo to access your microphone to record audio messages."
        }
      ],
      "expo-video"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      eas: {
        projectId: "d7866ba3-107a-4f4b-a67e-b6f3f34a39e0"
      }
    }
  }
}