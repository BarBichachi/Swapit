import { View, Text, StyleSheet, Image } from 'react-native';
import { Stack } from 'expo-router';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Native header */}
      <Stack.Screen options={{ title: 'My Profile' }} />

      {/* User profile image */}
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }}
        style={styles.profileImage}
      />

      {/* User details */}
      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.detail}>Email: john.doe@example.com</Text>
      <Text style={styles.detail}>Phone: +972 501234567</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    textAlign: 'center',
  },
});