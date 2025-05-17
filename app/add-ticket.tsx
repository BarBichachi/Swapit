import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';

export default function AddTicket() {
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const handleAddTicket = () => {
    if (!eventName || !date || !location) {
      Alert.alert('All fields are required');
      return;
    }
    Alert.alert('Ticket Added!');
    // Here later: call your API
  };

  return (
    <View style={styles.container}>
      {/* Use native header */}
      <Stack.Screen options={{ title: 'Add Ticket', presentation: 'modal' }} />

      <TextInput placeholder="Event Name" style={styles.input} value={eventName} onChangeText={setEventName} />
      <TextInput placeholder="Date (DD/MM/YYYY)" style={styles.input} value={date} onChangeText={setDate} />
      <TextInput placeholder="Location" style={styles.input} value={location} onChangeText={setLocation} />

      <Button title="Add Ticket" onPress={handleAddTicket} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
  },
});
