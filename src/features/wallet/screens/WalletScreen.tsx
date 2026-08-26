import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { ListItemCard } from '@shared/components/molecules/ListItemCard';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, shadows, useTheme } from '@theme/index';

const MOCK_TRANSACTIONS = [
  {
    id: 'tx_1',
    title: 'Cashback Received',
    date: '25 Jul 2026 • 11:20 AM',
    amount: '+ ₹208.00',
    isCredit: true,
    iconName: 'gift-outline',
    cat: 'emerald',
  },
  {
    id: 'tx_2',
    title: 'Service Payment',
    date: '18 Jul 2026 • 04:35 PM',
    amount: '- ₹450.00',
    isCredit: false,
    iconName: 'construct-outline',
    cat: 'orange',
  },
  {
    id: 'tx_3',
    title: 'AMC Purchase',
    date: '15 Jul 2026 • 10:10 AM',
    amount: '- ₹2,499.00',
    isCredit: false,
    iconName: 'shield-checkmark-outline',
    cat: 'indigo',
  },
  {
    id: 'tx_4',
    title: 'Refund Received',
    date: '10 Jul 2026 • 02:22 PM',
    amount: '+ ₹200.00',
    isCredit: true,
    iconName: 'cash-outline',
    cat: 'emerald',
  },
];

export const WalletScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Wallet"
        subtitle="Manage balance & transactions"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.iconActionBtn} activeOpacity={0.7}>
            <AppIcon name="ellipsis-vertical" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        }
      />

      {/* Wallet Balance Hero Card */}
      <Card style={styles.balanceCard} padding="lg">
        <View style={styles.balanceMainGroup}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹ 2,450.00</Text>
        </View>
        <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.8}>
          <AppIcon name="add" size="sm" color={colors.text.inverse} style={styles.addIcon} />
          <Text style={styles.addMoneyText}>Add Money</Text>
        </TouchableOpacity>
      </Card>

      {/* Recent Transactions List */}
      <View style={styles.txHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_TRANSACTIONS}
        keyExtractor={(item, index) => (item.id ? `${item.id}-${index}` : `tx-${index}`)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            iconName="wallet-outline"
            title="No Transactions Yet"
            description="Your recent wallet payments and cashback history will appear here."
          />
        }
        renderItem={({ item }) => {
          const catColors = (colors.category as any)[`${item.cat}Icon`]
            ? {
                icon: (colors.category as any)[`${item.cat}Icon`],
                bg: (colors.category as any)[`${item.cat}Bg`],
              }
            : { icon: colors.primary.main, bg: colors.primary.light };

          return (
            <ListItemCard
              iconName={item.iconName}
              iconColor={catColors.icon}
              iconBgColor={catColors.bg}
              title={item.title}
              dateText={item.date}
              statusLabel={item.amount}
              statusVariant={item.isCredit ? 'success' : 'danger'}
            />
          );
        }}
      />
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  balanceCard: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadows.large,
  },
  balanceMainGroup: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.background.default,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.inverse,
    marginTop: 4,
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.wallet.addMoneyBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.wallet.addMoneyBorder,
  },
  addIcon: {
    marginRight: 4,
  },
  addMoneyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '700',
  },
});
