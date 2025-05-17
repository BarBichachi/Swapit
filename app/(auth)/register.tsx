import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+972');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');

  const countryCodes = [
    { label: '+972 (Israel)', value: '+972' },
    { label: '+1 (USA)', value: '+1' },
    { label: '+44 (UK)', value: '+44' },
    { label: '+91 (India)', value: '+91' },
    { label: '+33 (France)', value: '+33' },
  ];

  const validateEmail = (email: string) =>
    /^\S+@\S+\.\S+$/.test(email);

  const validatePassword = (password: string) =>
    /^.{8,20}$/.test(password);

  const validatePhone = (phone: string) =>
    /^\d{8,12}$/.test(phone);

  const validateBirthDate = (date: string) =>
    /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(date);

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone || !birthDate || !gender) {
      Alert.alert('All fields are required');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid email format');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Password must be 8-20 characters long');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Invalid phone number');
      return;
    }
    if (!validateBirthDate(birthDate)) {
      Alert.alert('Birth date must be in DD/MM/YYYY format');
      return;
    }

    Alert.alert('Registration successful');
    // Later: call your API and navigate to login/home
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Register' }} />
      <Text style={styles.title}>Create your account</Text>

      <TextInput placeholder="First Name" style={styles.input} value={firstName} onChangeText={setFirstName} />
      <TextInput placeholder="Last Name" style={styles.input} value={lastName} onChangeText={setLastName} />
      <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput placeholder="Confirm Password" style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

      <Text style={styles.label}>Phone Number</Text>
      <View style={styles.row}>
        <View style={[styles.pickerWrapper, { flex: 1, marginRight: 10 }]}>
          <Picker style={{ height: 48 }} selectedValue={countryCode} onValueChange={(value) => setCountryCode(value)}>
            {countryCodes.map((code) => (
              <Picker.Item key={code.value} label={code.label} value={code.value} />
            ))}
          </Picker>
        </View>
        <TextInput placeholder="Phone Number" style={[styles.input, { flex: 3 }]} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      </View>

      <TextInput placeholder="Birth Date (DD/MM/YYYY)" style={styles.input} value={birthDate} onChangeText={setBirthDate} />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerWrapper}>
        <Picker style={{ height: 48 }} selectedValue={gender} onValueChange={(value) => setGender(value)}>
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <Button title="Register" onPress={handleRegister} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    height: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});