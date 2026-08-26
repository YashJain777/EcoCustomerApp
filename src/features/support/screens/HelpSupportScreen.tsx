/**
 * @file HelpSupportScreen.tsx
 * @feature Support / Screens
 * @responsibility Customer support desk, inquiry submission, and live CMS FAQ viewer.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { Button } from '@shared/components/atoms/Button';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, radius, useTheme } from '@theme/index';
import { supportApi } from '@infrastructure/api/supportApi';
import { cmsApi, CmsContentEntry } from '@infrastructure/api/cmsApi';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I register product digital warranty?',
    answer: 'When you purchase a SmartEco-certified appliance, simply open the app and scan the product QR code on the invoice or sticker to link warranty to your account.',
  },
  {
    id: 'faq-2',
    question: 'What happens during a warranty service visit?',
    answer: 'Under active warranty, certified technicians visit your address free of labor charges. Spares are covered per policy terms.',
  },
  {
    id: 'faq-3',
    question: 'How can I buy or renew an AMC plan?',
    answer: 'Navigate to the AMC Plans section on your home dashboard, select your preferred pack, and complete instant purchase.',
  },
];

export const HelpSupportScreen = ({ navigation }: any) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live CMS FAQ State
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    fetchLiveFaqs();
  }, []);

  const fetchLiveFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await cmsApi.getContentEntries('faq', 'customer');
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const fetchedFaqs: FaqItem[] = res.data.map((item: CmsContentEntry, index: number) => ({
          id: item.id || `cms-faq-${index}`,
          question: item.data?.question || item.data?.title || 'Frequently Asked Question',
          answer: item.data?.answer || item.data?.description || 'Details unavailable.',
        }));
        setFaqs(fetchedFaqs);
      }
    } catch (_err) {
      // Keep DEFAULT_FAQS as graceful fallback
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleSubmitInquiry = async () => {
    setErrorMsg(null);
    if (!subject.trim()) {
      setErrorMsg('Please enter a subject for your inquiry.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg('Message must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await supportApi.submitQuery({
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res?.success) {
        Alert.alert('Inquiry Submitted! 📩', 'Thank you for reaching out. Our support team will get back to you shortly.');
        setSubject('');
        setMessage('');
      } else {
        Alert.alert('Submission Error', res?.error?.message || 'Could not submit support inquiry.');
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err?.error?.message || err?.message || 'Could not send support request');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Help & Support"
        subtitle="Live FAQs and customer care desk"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>How can we help you?</Text>

        {/* 2x2 Action Cards Grid */}
        <View style={styles.gridRow}>
          <Card style={styles.supportCard} padding="md" onPress={() => navigation.navigate('TermsConditionsScreen')}>
            <View style={[styles.cardIconBg, styles.bgIndigo]}>
              <AppIcon name="document-text-outline" size="md" color={colors.category.indigoIcon} />
            </View>
            <Text style={styles.cardTitle}>Terms & Conditions</Text>
            <Text style={styles.cardDesc}>View policy & legal guidelines</Text>
          </Card>

          <Card
            style={styles.supportCard}
            padding="md"
            onPress={() => navigation.navigate('NotificationCenterScreen')}
          >
            <View style={[styles.cardIconBg, styles.bgEmerald]}>
              <AppIcon name="chatbubbles-outline" size="md" color={colors.category.emeraldIcon} />
            </View>
            <Text style={styles.cardTitle}>Alerts & Updates</Text>
            <Text style={styles.cardDesc}>View recent app notifications</Text>
          </Card>
        </View>

        <View style={styles.gridRow}>
          <Card
            style={styles.supportCard}
            padding="md"
            onPress={() => navigation.navigate('MainTab', { screen: 'BookingsScreenTab' })}
          >
            <View style={[styles.cardIconBg, styles.bgOrange]}>
              <AppIcon name="build-outline" size="md" color={colors.category.orangeIcon} />
            </View>
            <Text style={styles.cardTitle}>My Service Visits</Text>
            <Text style={styles.cardDesc}>Track active repair requests</Text>
          </Card>

          <Card
            style={styles.supportCard}
            padding="md"
            onPress={() => Alert.alert('Toll-Free Support', 'Call us at +91 1800 720 6567 (10 AM - 7 PM)')}
          >
            <View style={[styles.cardIconBg, styles.bgRose]}>
              <AppIcon name="call-outline" size="md" color={colors.category.roseIcon} />
            </View>
            <Text style={styles.cardTitle}>Call Support</Text>
            <Text style={styles.cardDesc}>+91 1800 720 6567{'\n'}10:00 AM - 7:00 PM</Text>
          </Card>
        </View>

        {/* Live CMS FAQs Section */}
        <Text style={styles.sectionHeadline}>Frequently Asked Questions</Text>
        {loadingFaqs ? (
          <ActivityIndicator size="small" color={colors.primary.main} style={styles.loaderMargin} />
        ) : (
          <View style={styles.faqList}>
            {faqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <Card key={faq.id} style={styles.faqCard} padding="md" onPress={() => toggleFaq(faq.id)}>
                  <View style={styles.faqHeaderRow}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <AppIcon
                      name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size="sm"
                      color={colors.primary.main}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {/* Submit Support Inquiry Form */}
        <Text style={styles.sectionHeadline}>Send Support Message</Text>
        <Card style={styles.formCard} padding="md">
          <Text style={styles.inputLabel}>Subject *</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Query regarding AMC coverage"
              placeholderTextColor={colors.text.muted}
              maxLength={100}
              value={subject}
              onChangeText={(val) => {
                setSubject(val);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Message *</Text>
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>
          <View style={styles.textAreaBox}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue or question in detail (min 10 chars)..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={message}
              onChangeText={(val) => {
                setMessage(val);
                if (errorMsg) setErrorMsg(null);
              }}
            />
          </View>

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <Button
            title={submitting ? 'Submitting...' : 'Submit Inquiry'}
            variant="cta"
            onPress={handleSubmitInquiry}
            loading={submitting}
            disabled={submitting}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
    },
    scrollContent: {
      paddingVertical: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    headline: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text.primary,
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    sectionHeadline: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text.primary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    gridRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    supportCard: {
      flex: 1,
    },
    cardIconBg: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    bgIndigo: { backgroundColor: colors.category.indigoBg },
    bgEmerald: { backgroundColor: colors.category.emeraldBg },
    bgOrange: { backgroundColor: colors.category.orangeBg },
    bgRose: { backgroundColor: colors.category.roseBg },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
    },
    cardDesc: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
      lineHeight: 16,
    },
    faqList: {
      gap: spacing.sm,
    },
    faqCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    faqHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    faqQuestion: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
      marginRight: spacing.sm,
    },
    faqAnswer: {
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: spacing.xs + 2,
      lineHeight: 18,
    },
    formCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    charCount: {
      fontSize: 11,
      color: colors.text.muted,
    },
    inputBox: {
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.main,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
    },
    textInput: {
      fontSize: 14,
      color: colors.text.primary,
      padding: 0,
    },
    textAreaBox: {
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.main,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.sm,
      minHeight: 100,
    },
    textArea: {
      fontSize: 14,
      color: colors.text.primary,
      textAlignVertical: 'top',
      padding: 0,
    },
    errorText: {
      fontSize: 12,
      color: colors.status.danger,
      marginTop: spacing.sm,
    },
    submitBtn: {
      marginTop: spacing.md,
    },
    loaderMargin: {
      marginVertical: spacing.md,
    },
  });
