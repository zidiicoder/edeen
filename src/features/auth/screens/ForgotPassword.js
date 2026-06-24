import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../../theme/colors";
import { forgotPasswordValidationSchema } from "../../../validation/validate";
import { handleBatchErrors } from "../../../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../../context/AuthContext";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({email: ""});
  const [errors, setErrors] = useState({});
  const { forgotPassword } = useContext(AuthContext);
  
  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

 const handleForgotPassword = async () => {
  setLoading(true);
  setErrors({});

  try {
    await forgotPasswordValidationSchema.validate(form, {abortEarly: false});
    AsyncStorage.setItem('email', form.email);
    const result = await forgotPassword(form.email);
    if (result.isError) {
      if (result.error) handleBatchErrors(result.error, setErrors);
      else setErrors({ email: "Something went wrong. Please try again." });
      setLoading(false);
      return;
    }
    navigation.navigate("ForgotPasswordChange");
  } catch (validationError) {
    handleBatchErrors(validationError, setErrors);
  }finally{
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Image
          source={require("../../../assets/images/edeen-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email to reset your password
        </Text>
        <View style={styles.inputGroup}>
          <View
            style={[
              styles.inputWrap,
              errors.email ? styles.inputErrorBorder : null,
            ]}
          >
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#9B9B9B"
              style={styles.input}
              value={form.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
          <TouchableOpacity
            style={styles.cta}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.ctaText}>Send OTP</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Remember your password?{" "}
              <Text style={styles.linkStrong}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 6,
  },

  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
  },

  inputGroup: {
    width: "100%",
    marginTop: 10,
    alignItems: "center",
  },

  inputWrap: {
    width: "100%",
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },

  input: {
    color: colors.textPrimary,
  },

  errorText: {
    width: "100%",
    color: "red",
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 5,
  },

  inputErrorBorder: {
    borderWidth: 1,
    borderColor: "red",
  },

  cta: {
    backgroundColor: colors.button,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },

  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  linkText: {
    marginTop: 14,
    color: colors.textMuted,
    fontSize: 12,
  },

  linkStrong: {
    color: colors.link,
    fontWeight: "600",
  },
});
