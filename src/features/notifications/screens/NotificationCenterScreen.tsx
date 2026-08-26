/**
 * @file NotificationCenterScreen.tsx
 * @feature Notifications / Screens
 * @responsibility Displays system alerts, booking updates, mechanic assignments,
 *                 and installation updates adhering strictly to DESIGN_SYSTEM.md.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Header } from '@shared/components/molecules/Header';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, useTheme } from '@theme/index';
import { notificationApi } from '@infrastructure/api/notificationApi';
import { NotificationItem } from '@core/types/api';
import { NotificationCard } from '../components/NotificationCard';

export const NotificationCenterScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const fetchNotifications = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await notificationApi.getNotifications();
      if (res?.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !n.isRead && n.status !== 'READ').length;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read && !n.isRead && n.status !== 'READ');
    if (unread.length === 0) {
      Alert.alert('Notifications', 'All notifications are already marked as read.');
      return;
    }

    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true, status: 'READ' }))
      );
      await Promise.allSettled(unread.map((n) => notificationApi.markAsRead(n.id)));
    } catch (err) {
      console.error('Error marking notifications read', err);
    }
  };

  const handleItemPress = async (item: NotificationItem) => {
    // 1. Mark as read optimistically
    if (!item.read && !item.isRead && item.status !== 'READ') {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true, isRead: true, status: 'READ' } : n))
      );
      notificationApi.markAsRead(item.id).catch(() => {});
    }

    const title = (item.title || item.meta?.title || '').toLowerCase();
    const body = (item.body || item.subtitle || '').toLowerCase();
    const metaData = item.meta?.data || {};

    // 2. Smart Deep-Link Navigation
    if (title.includes('feedback') || title.includes('rate') || body.includes('rate and review')) {
      const jobId = item.jobId || metaData.jobId;
      if (jobId) {
        navigation.navigate('SubmitReviewScreen', {
          jobId,
          jobType: 'SERVICE_JOB',
          description: item.title,
        });
        return;
      }
    }

    if (item.type === 'INSTALLATION' || metaData.type === 'INSTALLATION' || metaData.installationId) {
      navigation.navigate('MainTab', { screen: 'MyProductsScreenTab' });
      return;
    }

    if (item.type === 'JOB' || item.type === 'ALERT' || metaData.jobId || metaData.complaintId) {
      navigation.navigate('MainTab', { screen: 'BookingsScreenTab' });
      return;
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const title = (n.title || n.meta?.title || '').toLowerCase();
      const body = (n.body || n.subtitle || n.message || '').toLowerCase();
      const type = (n.type || '').toUpperCase();
      const metaData = n.meta?.data || {};
      const isRead = Boolean(n.read || n.isRead || n.status === 'READ');

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = title.includes(query) || body.includes(query);
        if (!matchesQuery) return false;
      }

      // Tab Category Filter
      if (activeTab === 'services') {
        return (
          type === 'JOB' ||
          type === 'ALERT' ||
          Boolean(metaData.jobId || metaData.complaintId) ||
          title.includes('service') ||
          title.includes('complaint') ||
          title.includes('mechanic')
        );
      }

      if (activeTab === 'installations') {
        return (
          type === 'INSTALLATION' ||
          metaData.type === 'INSTALLATION' ||
          Boolean(metaData.installationId) ||
          title.includes('installation')
        );
      }

      if (activeTab === 'unread') {
        return !isRead;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const tabsConfig = useMemo(() => {
    const servicesCount = notifications.filter(
      (n) => n.type === 'JOB' || n.type === 'ALERT' || n.meta?.data?.jobId || n.meta?.data?.complaintId
    ).length;
    const installCount = notifications.filter(
      (n) => n.type === 'INSTALLATION' || n.meta?.data?.installationId
    ).length;

    return [
      { id: 'all', label: `All (${notifications.length})` },
      { id: 'services', label: `Services (${servicesCount})` },
      { id: 'installations', label: `Install (${installCount})` },
      { id: 'unread', label: `Unread (${unreadCount})` },
    ];
  }, [notifications, unreadCount]);

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} Unread • ${notifications.length} Total Alerts`
            : `${notifications.length} Total Alerts`
        }
        onBackPress={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markReadActionBtn}
              activeOpacity={0.7}
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <AppIcon name="checkmark-done-outline" size="sm" color={colors.primary.main} />
              <AppText variant="caption" color="primary" style={styles.markReadText}>
                Mark Read
              </AppText>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Category Tabs */}
      <View style={styles.tabWrapper}>
        <SegmentedTabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </View>

      {/* Quick Search Filter Bar */}
      <View style={styles.searchBar}>
        <AppIcon name="search-outline" size="sm" color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by mechanic, booking, or appliance..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <AppIcon name="close-circle" size="xs" color={colors.text.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {errorMsg && (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <AppText variant="bodySm" style={styles.errorText}>
            {errorMsg}
          </AppText>
          <TouchableOpacity onPress={fetchNotifications} activeOpacity={0.75}>
            <AppText variant="labelSm" style={styles.retryText}>
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <AppText variant="bodyMd" color="textSecondary" style={styles.loadingText}>
            Loading your alerts...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          ListEmptyComponent={
            <EmptyState
              iconName={activeTab === 'unread' ? 'checkmark-circle-outline' : 'notifications-off-outline'}
              title={
                searchQuery
                  ? 'No Matching Alerts'
                  : activeTab === 'unread'
                  ? 'All Caught Up! 🎉'
                  : activeTab === 'services'
                  ? 'No Service Updates'
                  : activeTab === 'installations'
                  ? 'No Installation Alerts'
                  : 'No Notifications'
              }
              description={
                searchQuery
                  ? `No notifications found matching "${searchQuery}".`
                  : activeTab === 'unread'
                  ? 'You have read all your notifications.'
                  : 'You will receive updates here regarding your bookings, technician assignments, and warranties.'
              }
            />
          }
          renderItem={({ item }) => (
            <NotificationCard item={item} onPress={handleItemPress} />
          )}
        />
      )}
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    markReadActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary.main,
    },
    markReadText: {
      fontWeight: '700',
    },
    tabWrapper: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs + 2,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text.primary,
      paddingVertical: 0,
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm + 2,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    errorText: {
      flex: 1,
      color: colors.status.danger,
    },
    retryText: {
      fontWeight: '700',
      color: colors.status.danger,
    },
    loaderCenter: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.sm,
    },
  });
