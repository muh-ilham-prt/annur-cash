import "./global.css";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "./src/helpers/i18n";
import { Splash } from "./src/components/Splash";
import Router from "./src/router";

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [entered, setEntered] = useState(false);
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          {entered && <Router />}
          {!splashDone && (
            <Splash
              onDone={() => {
                setSplashDone(true);
                setEntered(true);
              }}
            />
          )}
        </View>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
