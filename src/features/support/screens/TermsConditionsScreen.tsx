import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, useTheme, getCommonStyles } from '@theme/index';
import { cmsApi, CmsStaticPage } from '@infrastructure/api/cmsApi';

import { QuillHtmlRenderer } from '@shared/components/molecules/QuillHtmlRenderer';

export const TermsConditionsScreen = ({ navigation }: any) => {
  const [page, setPage] = useState<CmsStaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { theme } = useTheme();
  const colors = theme.colors;
  const common = React.useMemo(() => getCommonStyles(colors), [colors]);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const fetchTerms = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await cmsApi.getPageBySlug('customer-terms-conditions');
      if (res?.success && res.data) {
        setPage(res.data);
      } else {
        setErrorMsg(res?.error?.message || 'Failed to load Terms & Conditions');
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || err?.message || 'Unable to fetch Terms & Conditions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTerms();
  };

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Terms & Conditions"
        subtitle="Customer policy and operational terms"
        onBackPress={() => navigation.goBack()}
      />

      {errorMsg && (
        <View style={common.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <Text style={common.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={fetchTerms}>
            <Text style={common.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={common.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={common.loadingText}>Fetching terms & conditions...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
        >
          {page ? (
            <>
              <Card style={styles.heroCard} padding="lg">
                <View style={styles.heroIconBox}>
                  <AppIcon name="document-text-outline" size={36} color={colors.primary.main} />
                </View>
                <Text style={styles.pageTitle}>{page.title || 'Terms & Conditions'}</Text>
                {page.seoDescription ? (
                  <Text style={styles.seoDescription}>{page.seoDescription}</Text>
                ) : null}
              </Card>

              <Card style={styles.contentCard} padding="lg">
                <QuillHtmlRenderer html={page.content} />
              </Card>
            </>
          ) : (
            <EmptyState
              iconName="document-text-outline"
              title="Terms Not Found"
              description="Terms & Conditions content is currently unavailable."
            />
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
    },
    scrollContent: {
      paddingVertical: spacing.md,
    },
    heroCard: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    heroIconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text.primary,
      textAlign: 'center',
    },
    seoDescription: {
      fontSize: 13,
      color: colors.text.muted,
      marginTop: 4,
      textAlign: 'center',
      fontWeight: '500',
    },
    contentCard: {
      marginBottom: spacing.xxl,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text.secondary,
    },
  });
