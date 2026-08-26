/**
 * @file MyReviewsScreen.tsx
 * @feature Reviews / Screens
 * @responsibility Customer review history screen rendering past submitted job ratings and reviews.
 */

import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '@theme/ThemeContext';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { AppText } from '@shared/components/atoms/AppText';
import { useCustomerReviews } from '../hooks/useCustomerReviews';
import { ReviewCard } from '../components/ReviewCard';
import { ReviewItem } from '../types/reviews.types';

export const MyReviewsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const {
    reviews,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    retry,
  } = useCustomerReviews();

  const renderItem = ({ item }: { item: ReviewItem }) => (
    <ReviewCard item={item} />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary.main} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        iconName="star"
        iconFamily="Feather"
        title="No Reviews Yet"
        description="You haven't submitted any service or installation reviews yet."
      />
    );
  };

  return (
    <ScreenWrapper scrollable={false} style={styles.screen}>
      <Header
        title="My Reviews"
        subtitle="Past service & installation ratings"
        onBackPress={() => navigation.goBack()}
      />

      {/* Error Banner with Retry */}
      {Boolean(error) && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color={colors.status.danger} />
          <AppText variant="caption" style={styles.errorText}>
            {error}
          </AppText>
          <TouchableOpacity onPress={retry} activeOpacity={0.7}>
            <AppText variant="caption" style={styles.retryText}>
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Spinner */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <AppText variant="bodySm" style={styles.loadingText}>
            Loading your reviews...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary.main}
              colors={[colors.primary.main]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    screen: { paddingHorizontal: 16, flex: 1 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.status.dangerBg || '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 12, gap: 8 },
    errorText: { color: colors.status.danger, flex: 1 },
    retryText: { color: colors.status.danger, fontWeight: '700' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    loadingText: { color: colors.text.secondary, marginTop: 12 },
    listContent: { paddingBottom: 24 },
    footerLoader: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  });
