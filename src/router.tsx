import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomNav, type NavId } from "./components/BottomNav";
import LoginScreen from "./pages/authentication/login";
import HomeScreen from "./pages/homepage";
import StudentsScreen from "./pages/students";
import RecordScreen from "./pages/record";
import PaymentTypesScreen from "./pages/payment-types";
import ReportScreen from "./pages/report";
import ProfileScreen from "./pages/profile";
import AboutScreen from "./pages/about";
import { TENANTS, TENANT, type Tenant, type TenantTheme } from "./theme/tenant";
import { fetchCurrentUser, signOut, type CurrentUser } from "./helpers/auth";
import { useEffect, useState } from "react";
import { EditProfileSheet } from "./pages/profile/EditProfileSheet";
import { ChangePasswordSheet } from "./pages/profile/ChangePasswordSheet";

// The five menu destinations share one mounted bar; only the tab content swaps.
export type MainTabParamList = {
  Home: undefined;
  Students: undefined;
  // Jenis lives in the Catat stack; naming it here gives a typed jump from Home.
  Record: { screen?: keyof CatatStackParamList } | undefined;
  Report: undefined;
  Profile: undefined;
};

export type CatatStackParamList = {
  Catat: undefined;
  Types: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AppTabBar({ state, navigation, theme }: BottomTabBarProps & { theme: TenantTheme }) {
  const active = state.routeNames[state.index] as NavId;
  return (
    <BottomNav
      activeId={active}
      theme={theme}
      // Record must name its root screen, else the tab reopens whichever stack screen (Types) was last shown.
      onSelect={(id) => (id === "Record" ? navigation.navigate("Record", { screen: "Catat" }) : navigation.navigate(id))}
    />
  );
}

// Jenis is a detail screen of Catat: both sit in one stack, so the tab bar stays put.
// Root must match the tab entry's, or navigation refuses the jump.
const CatatStack = createNativeStackNavigator<CatatStackParamList>();

function CatatFlow() {
  return (
    <CatatStack.Navigator screenOptions={{ headerShown: false }}>
      <CatatStack.Screen name="Catat">{() => <RecordScreen />}</CatatStack.Screen>
      <CatatStack.Screen name="Types">{() => <PaymentTypesScreen />}</CatatStack.Screen>
    </CatatStack.Navigator>
  );
}

type MainTabsProps = { tenant: Tenant; onLogout: () => void; onAbout: () => void };

function MainTabs({ tenant, onLogout, onAbout }: MainTabsProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  useEffect(() => { void fetchCurrentUser().then(setUser); }, []);
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} theme={TENANTS[tenant]} />}
    >
      <Tab.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            onPressNav={(id) => (id === "Types" ? navigation.navigate("Record", { screen: "Types" }) : id === "Record" ? navigation.navigate("Record", { screen: "Catat" }) : navigation.navigate(id))}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Students">{() => <StudentsScreen />}</Tab.Screen>
      <Tab.Screen name="Record">{() => <CatatFlow />}</Tab.Screen>
      <Tab.Screen name="Report">{() => <ReportScreen />}</Tab.Screen>
      <Tab.Screen name="Profile">
        {() => (
          <>
            <ProfileScreen
              onLogout={onLogout}
              onChangePassword={() => setChangingPassword(true)}
              onEditProfile={() => setEditing(true)}
              onAbout={onAbout}
              user={user}
            />
            {changingPassword && (
              <ChangePasswordSheet onClose={() => setChangingPassword(false)} onSaved={() => {}} />
            )}
            {/* profile editor */}
            {editing && user && <EditProfileSheet user={user} onClose={() => setEditing(false)} onSaved={setUser} />}
          </>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function Router({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={authenticated ? "Main" : "Login"} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onSubmit={() => navigation.reset({ index: 0, routes: [{ name: "Main" }] })}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="About">
          {({ navigation }) => <AboutScreen onBack={() => navigation.goBack()} />}
        </Stack.Screen>
        <Stack.Screen name="Main">
          {({ navigation }) => (
            <MainTabs
              tenant={TENANT}
              onAbout={() => navigation.navigate("About")}
              onLogout={() => void signOut().finally(() => navigation.reset({ index: 0, routes: [{ name: "Login" }] }))}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
