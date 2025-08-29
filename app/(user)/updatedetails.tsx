import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
    backgroundColor: "#fff",
  },
  box: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 24,
    marginTop: 24,
    elevation: 2,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: 8,
    marginTop: 2,
    fontSize: 13,
  },
});

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^05\d{8}$/.test(phone.replace(/\D/g, ""));
}

function validateName(name: string) {
  return name.trim().length >= 2;
}

export default function UpdateDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user, profile, hydrated, updateProfile, refreshProfile } =
    useAuthContext();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? "");
    setLastName(profile.last_name ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
  }, [profile]);

  const handleSubmit = async () => {
    let newErrors: { [key: string]: string } = {};
    if (!validateName(firstName))
      newErrors.firstName = "Enter a valid first name";
    if (!validateName(lastName)) newErrors.lastName = "Enter a valid last name";
    if (!validateEmail(email)) newErrors.email = "Enter a valid email";
    if (!validatePhone(phone))
      newErrors.phone = "Enter a valid phone (format: 05XXXXXXXX)";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!user?.id) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone.replace(/\D/g, ""),
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      // ensure any subscribers refetch if needed
      await refreshProfile();
      Alert.alert("Success", "Details updated!");
      router.back();
    }
  };

  if (!hydrated) {
    return (
      <View style={styles.container}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Please log in first</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
          Update Personal Details
        </Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
        />
        {errors.firstName && (
          <Text style={styles.error}>{errors.firstName}</Text>
        )}

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
        />
        {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="05XXXXXXXX"
          keyboardType="phone-pad"
          maxLength={10}
        />
        {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading || !profile || !user}
        >
          <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Update"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
