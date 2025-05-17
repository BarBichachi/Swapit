import { DarkTheme, DefaultTheme, ThemeProvider, DrawerActions } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Slot, useNavigation } from 'expo-router';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

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
  const navigation = useNavigation();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer.Navigator
        drawerContent={() => <CustomDrawerContent />}
        screenOptions={{
          drawerPosition: 'right',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              accessibilityLabel="Toggle drawer"
              style={styles.hamburgerContainer}
            >
            <Ionicons name="person-circle-outline" size={40} color="black" />
            </TouchableOpacity>
          ),
          headerTitle: 'Swapit',
        }}
      >
        <Drawer.Screen name="index" component={Slot} />
      </Drawer.Navigator>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  hamburgerContainer: {
    padding: 8,
  },
  hamburger: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
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