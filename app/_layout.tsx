import { DarkTheme, DefaultTheme, ThemeProvider, DrawerActions } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Slot } from 'expo-router';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';



export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function CustomDrawerContent() {
  return (
    <View style={styles.drawer}>
      <Text style={styles.menuItem}>Menu Item 1</Text>
      <Text style={styles.menuItem}>Menu Item 2</Text>
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

   return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerTitle: 'Swapit',
          headerTitleAlign: 'center',
          drawerStyle: { width: 250 },
          swipeEnabled: true,
          drawerPosition: 'right',
          drawerType: 'front',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={styles.iconContainer}
              accessibilityLabel="Go to profile"
            >
              <Ionicons name="person-circle-outline" size={28} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={styles.iconContainer}
              accessibilityLabel="Toggle drawer"
            >
              <Ionicons name="menu" size={28} color="black" />
            </TouchableOpacity>
          ),
        })}
      >
        {/* No Drawer.Screen needed — Expo Router will handle files inside /app automatically */}
      </Drawer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 16,
  },
  drawer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  menuItem: {
    fontSize: 18,
    marginVertical: 10,
  },
});
