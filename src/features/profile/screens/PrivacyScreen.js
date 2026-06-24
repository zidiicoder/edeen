import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../theme/colors';
import ProfileHeader from '../components/ProfileHeader';

const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    body:
      'When you use Edeen, we may collect the information you voluntarily provide, including your name and email address during registration or when contacting us for support.',
  },
  {
    title: 'How We Use Your Information',
    body:
      'We use your information to provide the services offered through the App, including sending updates and notifications related to your account and the App experience.',
  },
  {
    title: 'Communications',
    body:
      'We may use your email address to communicate with you about your account, service updates, and promotional offers. You may opt out of promotional emails at any time.',
  },
  {
    title: 'Sharing of Your Information',
    body:
      'We do not share your information with third parties except where needed to operate the App or comply with legal obligations.',
  },
  {
    title: 'Service Providers',
    body:
      'We may work with trusted third-party service providers to help deliver services such as app hosting or email delivery. These providers are required to protect your information and use it only for the purposes we specify.',
  },
  {
    title: 'Legal Compliance',
    body:
      'We may disclose your information if required by law or in response to a valid legal request, including court orders or government inquiries.',
  },
  {
    title: 'Data Security',
    body:
      'We take reasonable measures to protect your information, including safeguards such as encryption and access controls to help prevent unauthorized access or disclosure.',
  },
  {
    title: "Children's Privacy",
    body:
      'Edeen is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.',
  },
  {
    title: 'Changes to This Privacy Policy',
    body:
      'We may update this Privacy Policy at any time. If material changes are made, we will notify you by updating the effective date at the top of this page or through other appropriate means.',
  },
  {
    title: 'Contact Us',
    body:
      'If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at edeenapp@gmail.com.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ProfileHeader title="Privacy Policy" />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Privacy Policy for Edeen</Text>
            <Text style={styles.effectiveDate}>Effective Date: 01/03/24</Text>
            <Text style={styles.intro}>
              Thank you for choosing Edeen. This Privacy Policy describes how
              Edeen collects, uses, shares, and protects your information when
              you use our mobile application. By accessing or using the App, you
              agree to this Privacy Policy. If you do not agree, please do not
              use the App.
            </Text>
          </View>

          {PRIVACY_SECTIONS.map(section => (
            <View key={section.title} style={styles.card}>
              <Text style={styles.title}>{section.title}</Text>
              <Text style={styles.sub}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#E9EEF5',
    borderRadius: 22,
    padding: 18,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  effectiveDate: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#68707C',
  },
  intro: {
    marginTop: 10,
    fontSize: 13,
    color: '#555D68',
    lineHeight: 20,
  },
  card: {
    marginTop: 16,
    backgroundColor: '#F3F5F8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E7EE',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 8,
    fontSize: 12,
    color: '#5C5C5C',
    lineHeight: 18,
  },
});
