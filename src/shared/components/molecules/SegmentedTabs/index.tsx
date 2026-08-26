import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '../../atoms/AppText';
import { spacing, radius, useTheme } from '@theme/index';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface SegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({ tabs, activeTab, onSelectTab }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => onSelectTab(tab.id)}
              style={[styles.tab, isActive ? styles.activeTab : styles.inactiveTab]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <AppText
                variant="labelMd"
                style={[styles.tabLabel, isActive ? styles.activeTabLabel : styles.inactiveTabLabel]}
              >
                {tab.label}
              </AppText>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isActive ? styles.activeCountBadge : styles.inactiveCountBadge,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.countText,
                      isActive ? styles.activeCountText : styles.inactiveCountText,
                    ]}
                  >
                    {tab.count}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
      marginHorizontal: -spacing.lg,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs + 4,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      gap: 6,
    },
    activeTab: {
      backgroundColor: colors.primary.main,
      elevation: 3,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    inactiveTab: {
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    tabLabel: {
      fontWeight: '600',
    },
    activeTabLabel: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    inactiveTabLabel: {
      color: colors.text.secondary,
    },
    countBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.pill,
      minWidth: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeCountBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    inactiveCountBadge: {
      backgroundColor: colors.neutral[100],
    },
    countText: {
      fontSize: 10,
      fontWeight: '700',
    },
    activeCountText: {
      color: colors.text.inverse,
    },
    inactiveCountText: {
      color: colors.text.muted,
    },
  });

