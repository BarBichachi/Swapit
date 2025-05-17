import { View, Text, StyleSheet } from 'react-native';

export default function EventCard({ event }: { event: { title: string; date: string; location: string } }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.date}>{event.date}</Text>
      <Text style={styles.location}>{event.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 15,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  date: {
    color: '#555',
    marginTop: 4,
  },
  location: {
    color: '#777',
    marginTop: 2,
  },
});
