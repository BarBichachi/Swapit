import { View, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import EventCard from '../components/EventCard';

const dummyEvents = [
  { id: '1', title: 'Concert A', date: '2025-05-20', location: 'Tel Aviv' },
  { id: '2', title: 'Festival B', date: '2025-05-22', location: 'Haifa' },
  { id: '3', title: 'Match C', date: '2025-05-24', location: 'Jerusalem' },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter(); // ✅ Correct hook for pushing routes
  const [searchText, setSearchText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Swapit',
      headerTitleAlign: 'center',
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={40} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => Alert.alert('Open Menu')}>
          <Ionicons name="menu" size={40} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color="#aaa" style={{ marginHorizontal: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Event list */}
      <FlatList
        data={dummyEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
      />

      {/* Floating add ticket button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/add-ticket')}
      >
        <Ionicons name="add-circle" size={70} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchWrapper: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 8,
    margin: 15,
    alignItems: 'center',
    paddingHorizontal: 5,
    height: 40,
  },
  searchInput: {
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
});
