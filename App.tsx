import "./global.css";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Splash } from "./src/components/Splash";
import Router from "./src/router";
import { getToken } from "./src/helpers/auth";

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [entered, setEntered] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    void getToken().then((token) => setAuthenticated(Boolean(token)));
  }, []);

  return (
    <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          {entered && <Router authenticated={authenticated} />}
          {!splashDone && (
            <Splash
              onDone={() => {
                setSplashDone(true);
                setEntered(true);
              }}
            />
          )}
        </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
