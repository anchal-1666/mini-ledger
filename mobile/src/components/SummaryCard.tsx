import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanSummary } from '../types';

interface SummaryCardProps {
  summary: LoanSummary | null;
  loading: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, loading }) => {
  const formatCurrency = (val: number = 0) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const totalLent = summary?.totalLent || 0;
  const totalRepaid = summary?.totalRepaid || 0;
  const overdueAmount = summary?.overdueAmount || 0;

  return (
    <View style={styles.card}>
      {/* Top Banner / Title */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.iconContainer}>
            <Ionicons name="bar-chart" size={17} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Financial Overview</Text>
            <Text style={styles.headerSub}>Summary of money lent</Text>
          </View>
        </View>

        <View style={styles.activePill}>
          <View style={styles.activePillDot} />
          <Text style={styles.activePillText}>
            {summary?.stats.activeCount || 0} Active
          </Text>
        </View>
      </View>

      {/* Main Highlights Grid */}
      <View style={styles.gridContainer}>
        {/* Total Lent */}
        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <View style={styles.statIconWrap}>
              <Ionicons name="trending-up" size={16} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>Total Lent</Text>
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : formatCurrency(totalLent)}
          </Text>
          <Text style={styles.statSub}>
            {summary?.stats.totalCount || 0} total records
          </Text>
        </View>

        {/* Total Repaid (Clean Blue/Neutral, no green) */}
        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <View style={[styles.statIconWrap, styles.statIconWrapNeutral]}>
              <Ionicons name="checkmark-done" size={16} color="#475569" />
            </View>
            <Text style={styles.statLabel}>Total Repaid</Text>
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : formatCurrency(totalRepaid)}
          </Text>
          <Text style={styles.statSub}>
            {summary?.stats.repaidCount || 0} settled
          </Text>
        </View>
      </View>

      {/* Overdue Warning Callout (Red only for overdue tag) */}
      <View
        style={[
          styles.overdueCallout,
          overdueAmount > 0 ? styles.overdueActive : styles.overdueClear,
        ]}
      >
        <View
          style={[
            styles.overdueIconWrap,
            overdueAmount > 0 ? styles.overdueIconWrapActive : styles.overdueIconWrapClear,
          ]}
        >
          <Ionicons
            name={overdueAmount > 0 ? 'alert-circle' : 'checkmark-circle-outline'}
            size={18}
            color={overdueAmount > 0 ? '#DC2626' : '#64748B'}
          />
        </View>

        <View style={styles.overdueContent}>
          <Text
            style={[
              styles.overdueTitle,
              overdueAmount > 0 && styles.overdueTitleActive,
            ]}
          >
            {overdueAmount > 0 ? 'Overdue Amount' : 'No Overdue Loans'}
          </Text>
          <Text style={styles.overdueSub}>
            {overdueAmount > 0
              ? `${summary?.stats.overdueCount || 0} loan(s) past due date`
              : 'All pending loans are on schedule'}
          </Text>
        </View>

        <View style={styles.overdueAmountWrap}>
          <Text
            style={[
              styles.overdueAmountText,
              overdueAmount > 0 ? styles.overdueAmountActive : styles.overdueAmountZero,
            ]}
          >
            {loading ? '...' : formatCurrency(overdueAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconWrapNeutral: {
    backgroundColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statSub: {
    fontSize: 11,
    color: '#64748B',
  },
  overdueCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  overdueActive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueClear: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  overdueIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueIconWrapActive: {
    backgroundColor: '#FEE2E2',
  },
  overdueIconWrapClear: {
    backgroundColor: '#F1F5F9',
  },
  overdueContent: {
    flex: 1,
  },
  overdueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  overdueTitleActive: {
    color: '#DC2626',
  },
  overdueSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  overdueAmountWrap: {
    alignItems: 'flex-end',
  },
  overdueAmountText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  overdueAmountActive: {
    color: '#DC2626',
  },
  overdueAmountZero: {
    color: '#64748B',
  },
});
