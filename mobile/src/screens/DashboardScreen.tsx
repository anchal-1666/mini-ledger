import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { loanApi } from '../api/client';
import { Loan, LoanSummary, LoanFilter } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { LoanItem } from '../components/LoanItem';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptViewerModal } from '../components/ReceiptViewerModal';

export const DashboardScreen: React.FC = () => {
  const { logout } = useAuth();

  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<LoanFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Modals
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    friendName: string;
  } | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch summary and loans in parallel
      const [summaryRes, loansRes] = await Promise.all([
        loanApi.getSummary(),
        loanApi.getLoans(filter === 'all' ? undefined : filter),
      ]);

      setSummary(summaryRes);
      setLoans(loansRes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Network Error', 'Failed to fetch loan records. Please check the backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleRepay = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await loanApi.markAsRepaid(id, !currentStatus);
      // Optimistically update list
      setLoans((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
      );
      // Refresh summary
      const freshSummary = await loanApi.getSummary();
      setSummary(freshSummary);
    } catch (error) {
      console.error('Error toggling repayment:', error);
      Alert.alert('Error', 'Failed to update repayment status');
    }
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await loanApi.deleteLoan(id);
      setLoans((prev) => prev.filter((l) => l.id !== id));
      const freshSummary = await loanApi.getSummary();
      setSummary(freshSummary);
    } catch (error) {
      console.error('Error deleting loan:', error);
      Alert.alert('Error', 'Failed to delete loan');
    }
  };

  const handleCreateLoan = async (data: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
    receiptUri?: string;
  }) => {
    await loanApi.createLoan(data);
    fetchData(true);
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalVisible(true);
  };

  // Primary Blue theme across tabs (red only for overdue tag)
  const filters: { key: LoanFilter; label: string; icon: string; activeColor: string }[] = [
    { key: 'all', label: 'All', icon: 'layers-outline', activeColor: '#2563EB' },
    { key: 'active', label: 'Active', icon: 'time-outline', activeColor: '#2563EB' },
    { key: 'overdue', label: 'Overdue', icon: 'alert-circle-outline', activeColor: '#DC2626' },
    { key: 'repaid', label: 'Repaid', icon: 'checkmark-circle-outline', activeColor: '#2563EB' },
  ];

  const getFilterCount = (key: LoanFilter) => {
    if (!summary) return 0;
    switch (key) {
      case 'all': return summary.stats.totalCount;
      case 'active': return summary.stats.activeCount;
      case 'overdue': return summary.stats.overdueCount;
      case 'repaid': return summary.stats.repaidCount;
    }
  };

  // Strict client-side filter guarantee: active section NEVER shows overdue entries
  const filteredLoans = loans.filter((l) => {
    if (filter === 'overdue') return l.isOverdue && !l.isRepaid;
    if (filter === 'active') return !l.isRepaid && !l.isOverdue;
    if (filter === 'repaid') return l.isRepaid;
    return true;
  });

  const renderHeader = () => (
    <View>
      {/* Summary Card at the top */}
      <SummaryCard summary={summary} loading={loading && !refreshing} />

      {/* Filter Tabs with generous horizontal padding */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterBarContainer}
      >
        {filters.map((f) => {
          const isActive = filter === f.key;
          const count = getFilterCount(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: f.activeColor,
                  borderColor: f.activeColor,
                },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={f.icon as any}
                size={15}
                color={isActive ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
              <View
                style={[
                  styles.filterCount,
                  isActive && styles.filterCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    isActive && styles.filterCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.listSectionHeader}>
        <Text style={styles.listSectionTitle}>
          {filter === 'overdue'
            ? 'Action Required'
            : filter === 'active'
            ? 'Active Loans'
            : filter === 'repaid'
            ? 'Repaid History'
            : 'All Entries'}
        </Text>
        <Text style={styles.listSectionCount}>
          {filteredLoans.length} {filteredLoans.length === 1 ? 'record' : 'records'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.emptyTitle}>Loading entries...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconCircle,
            filter === 'overdue' && styles.emptyIconCircleOverdue,
          ]}
        >
          <Ionicons
            name={filter === 'overdue' ? 'checkmark-circle-outline' : 'wallet-outline'}
            size={36}
            color={filter === 'overdue' ? '#2563EB' : '#2563EB'}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {filter === 'overdue'
            ? 'No Overdue Loans!'
            : filter === 'active'
            ? 'No Active Loans'
            : filter === 'repaid'
            ? 'No Repaid Loans'
            : 'No Records Yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {filter === 'overdue'
            ? 'Great news — all friend loans are on schedule.'
            : filter === 'active'
            ? 'You have no active pending loans at the moment.'
            : 'Start by tapping the + button to track a new loan.'}
        </Text>

        {filter !== 'overdue' && (
          <TouchableOpacity
            style={styles.emptyCtaBtn}
            onPress={() => setIsAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyCtaText}>Add First Loan</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.miniLogo}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.appName}>MiniLedger</Text>
            <Text style={styles.appTagline}>Loan Tracker</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogoutConfirm}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* List of Entries */}
      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LoanItem
            loan={item}
            onToggleRepay={handleToggleRepay}
            onDelete={handleDeleteLoan}
            onViewReceipt={(receiptUrl, friendName) =>
              setSelectedReceipt({ url: receiptUrl, friendName })
            }
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={['#2563EB']}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.fabInner}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleCreateLoan}
      />

      {/* Receipt Preview Modal */}
      <ReceiptViewerModal
        visible={!!selectedReceipt}
        receiptUrl={selectedReceipt?.url || null}
        friendName={selectedReceipt?.friendName || ''}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Custom Logout Confirmation Dialog */}
      <Modal
        visible={isLogoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Logout Warning Icon */}
            <View style={styles.modalIconWrap}>
              <View style={styles.modalIconInner}>
                <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              </View>
            </View>

            {/* Modal Title & Message */}
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to sign out of MiniLedger? You will need to verify your phone number to log back in.
            </Text>

            {/* Action Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalLogoutBtn}
                onPress={() => {
                  setIsLogoutModalVisible(false);
                  logout();
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="log-out" size={17} color="#FFFFFF" />
                <Text style={styles.modalLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 64, // Leaves clearance for the Expo Go floating developer menu button
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) + 12 : 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: -1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listContainer: {
    paddingBottom: 100,
  },
  filterBarContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  listSectionCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emptyIconCircleOverdue: {
    backgroundColor: '#EFF6FF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  /* Custom Logout Dialog Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  modalDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: -0.2,
  },
  modalLogoutBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  modalLogoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
