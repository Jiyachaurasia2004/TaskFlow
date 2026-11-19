
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

const ProfileScreen = ({
  currentUser,
  onBack,
  onLogout,
  onSave,
  onChangePassword,
}) => {
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
  useEffect(() => {
    setName(currentUser?.name || "");
    setEmail(currentUser?.email || "");
  }, [currentUser]);

  return (
      <ScrollView
    style={styles.container}
    contentContainerStyle={{ paddingBottom: 50 }}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={true}
  >
    <View style={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backButton}>← Back</Text>
      </Pressable>

      <Text style={styles.heading}>My Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <Text style={styles.name}>{name || "User"}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable
        style={styles.saveButton}
        onPress={() => onSave({ name, email })}
      >
        <Text style={styles.saveText}>Save Changes</Text>
      </Pressable>
{/* Change Password Section */}
<Text style={styles.sectionHeading}>
  Change Password 🔐
</Text>

<Text style={styles.label}>Current Password</Text>
<TextInput
  style={styles.input}
  value={currentPassword}
  onChangeText={setCurrentPassword}
  placeholder="Enter current password"
  secureTextEntry
/>

<Text style={styles.label}>New Password</Text>
<TextInput
  style={styles.input}
  value={newPassword}
  onChangeText={setNewPassword}
  placeholder="Enter new password"
  secureTextEntry
/>

<Text style={styles.label}>Confirm New Password</Text>
<TextInput
  style={styles.input}
  value={confirmPassword}
  onChangeText={setConfirmPassword}
  placeholder="Confirm new password"
  secureTextEntry
/>
<Pressable
  style={styles.saveButton}
  onPress={async () => {
    const success = await onChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }}
>
  <Text style={styles.saveText}>Update Password</Text>
</Pressable>
      <Pressable
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: "#F7F7FC",
  paddingHorizontal: 20,
  paddingTop: 20,
  paddingBottom: 20,
},
  backButton: {
    color: "#6654D9",
    fontSize: 16,
    fontWeight: "600",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#25213A",
    marginTop: 25,
    marginBottom: 25,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    marginBottom: 25,
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: "#E9E3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6654D9",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#25213A",
  },
  email: {
    fontSize: 14,
    color: "#89869A",
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#39334D",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E3F2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    fontSize: 15,
    color: "#302B43",
  },
  saveButton: {
    backgroundColor: "#6654D9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#FEE2E2",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeading: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#25213A",
  marginTop: 25,
  marginBottom: 18,
},
});

export default ProfileScreen;
