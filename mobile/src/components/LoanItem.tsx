import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loan } from '../types';

interface LoanItemProps {
  loan: Loan;
  onToggleRepay: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewReceipt: (url: string, friendName: string) => void;
}

export const LoanItem: React.FC<LoanItemProps> = ({
  loan,
  onToggleRepay,
  onDelete,
  onViewReceipt,
}) => {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Due date calculations
  const dueDate = new Date(loan.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);
  const diffTime = dueDay.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const handleToggle = async () => {
    try {
      setUpdating(true);
      await onToggleRepay(loan.id, loan.isRepaid);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = () => {
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      setDeleting(true);
      await onDelete(loan.id);
      setIsDeleteModalVisible(false);
    } catch (e) {
      setIsDeleteModalVisible(false);
    } finally {
      setDeleting(false);
    }
  };

  const initials = loan.friendName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Status flags (Red only for overdue tags)
  const isOverdue = loan.isOverdue && !loan.isRepaid;

  return (
    <View
      style={[
        styles.card,
        loan.isRepaid && styles.cardRepaid,
        isOverdue && styles.cardOverdue,
      ]}
    >
      {/* Overdue Alert Banner (Red tag) */}
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <View style={styles.overdueBannerIcon}>
            <Ionicons name="alert-circle" size={13} color="#FFFFFF" />
          </View>
          <Text style={styles.overdueBannerText}>
            OVERDUE by {Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? 'day' : 'days'}
          </Text>
        </View>
      )}

      {/* Repaid Strip (Neutral, no green) */}
      {loan.isRepaid && (
        <View style={styles.repaidBanner}>
          <Ionicons name="checkmark-done" size={13} color="#64748B" />
          <Text style={styles.repaidBannerText}>Repaid & Settled</Text>
        </View>
      )}

      <View style={styles.contentRow}>
        {/* Avatar (Blue for active, red for overdue, slate for repaid) */}
        <View
          style={[
            styles.avatar,
            isOverdue
              ? styles.avatarOverdue
              : loan.isRepaid
              ? styles.avatarRepaid
              : styles.avatarActive,
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              isOverdue
                ? styles.avatarTextOverdue
                : loan.isRepaid
                ? styles.avatarTextRepaid
                : styles.avatarTextActive,
            ]}
          >
            {initials || '?'}
          </Text>
        </View>

        {/* Friend Details */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.friendName, loan.isRepaid && styles.textMuted]}
              numberOfLines={1}
            >
              {loan.friendName}
            </Text>
            {loan.receiptUrl && (
              <TouchableOpacity
                onPress={() => onViewReceipt(loan.receiptUrl!, loan.friendName)}
                style={styles.receiptBadge}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="document-attach" size={12} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>

          {/* Due date info */}
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={isOverdue ? '#DC2626' : '#94A3B8'}
            />
            <Text
              style={[
                styles.dateText,
                isOverdue && styles.dateTextOverdue,
              ]}
            >
              {formatDate(loan.dueDate)}
              {!loan.isRepaid && !loan.isOverdue && daysDiff >= 0 && (
                <Text style={styles.dateRelativeText}>
                  {' '}· {daysDiff}d left
                </Text>
              )}
            </Text>
          </View>

          {/* Optional notes */}
          {loan.notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              {loan.notes}
            </Text>
          ) : null}
        </View>

        {/* Amount & Status Badge */}
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amountText,
              loan.isRepaid && styles.amountRepaid,
              isOverdue && styles.amountOverdue,
            ]}
          >
            {formatCurrency(loan.amount)}
          </Text>

          <View
            style={[
              styles.statusPill,
              isOverdue
                ? styles.statusPillOverdue
                : loan.isRepaid
                ? styles.statusPillRepaid
                : styles.statusPillActive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isOverdue
                  ? styles.statusDotOverdue
                  : loan.isRepaid
                  ? styles.statusDotRepaid
                  : styles.statusDotActive,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isOverdue
                  ? styles.statusTextOverdue
                  : loan.isRepaid
                  ? styles.statusTextRepaid
                  : styles.statusTextActive,
              ]}
            >
              {loan.isRepaid ? 'Repaid' : isOverdue ? 'Overdue' : 'Active'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            loan.isRepaid ? styles.actionButtonUndo : styles.actionButtonRepay,
          ]}
          onPress={handleToggle}
          disabled={updating || deleting}
          activeOpacity={0.8}
        >
          {updating ? (
            <ActivityIndicator
              size="small"
              color={loan.isRepaid ? '#475569' : '#FFFFFF'}
            />
          ) : (
            <>
              <Ionicons
                name={loan.isRepaid ? 'arrow-undo' : 'checkmark-circle'}
                size={15}
                color={loan.isRepaid ? '#475569' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  loan.isRepaid && styles.actionButtonTextMuted,
                ]}
              >
                {loan.isRepaid ? 'Unpaid' : 'Repaid'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete button (Turns RED on hover / press) */}
        <Pressable
          onHoverIn={() => setIsDeleteHovered(true)}
          onHoverOut={() => setIsDeleteHovered(false)}
          onPressIn={() => setIsDeleteHovered(true)}
          onPressOut={() => setIsDeleteHovered(false)}
          style={[
            styles.deleteButton,
            isDeleteHovered && styles.deleteButtonHovered,
          ]}
          onPress={confirmDelete}
          disabled={updating || deleting}
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={isDeleteHovered ? '#DC2626' : '#94A3B8'}
          />
        </Pressable>
      </View>

      {/* Modern Custom Delete Confirmation Dialog */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Warning Icon Badge */}
            <View style={styles.modalIconWrap}>
              <View style={styles.modalIconInner}>
                <Ionicons name="trash" size={24} color="#DC2626" />
              </View>
            </View>

            {/* Modal Title & Message */}
            <Text style={styles.modalTitle}>Delete Loan Entry?</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete this record? This action cannot be undone.
            </Text>

            {/* Record Summary Box */}
            <View style={styles.modalRecordBox}>
              <View style={styles.modalRecordAvatar}>
                <Text style={styles.modalRecordAvatarText}>{initials || '?'}</Text>
              </View>
              <View style={styles.modalRecordDetails}>
                <Text style={styles.modalRecordName} numberOfLines={1}>
                  {loan.friendName}
                </Text>
                <Text style={styles.modalRecordDate}>
                  Due: {formatDate(loan.dueDate)}
                </Text>
              </View>
              <Text style={styles.modalRecordAmount}>
                {formatCurrency(loan.amount)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={deleting}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalDeleteBtn, deleting && styles.modalBtnDisabled]}
                onPress={handleDeleteConfirmed}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={17} color="#FFFFFF" />
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRepaid: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.88,
  },
  cardOverdue: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  overdueBannerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  repaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 5,
  },
  repaidBannerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarActive: {
    backgroundColor: '#EFF6FF',
  },
  avatarOverdue: {
    backgroundColor: '#FEE2E2',
  },
  avatarRepaid: {
    backgroundColor: '#F1F5F9',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  avatarTextActive: {
    color: '#2563EB',
  },
  avatarTextOverdue: {
    color: '#DC2626',
  },
  avatarTextRepaid: {
    color: '#64748B',
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  receiptBadge: {
    padding: 3,
    borderRadius: 5,
    backgroundColor: '#EFF6FF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dateTextOverdue: {
    color: '#DC2626',
    fontWeight: '700',
  },
  dateRelativeText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textMuted: {
    color: '#64748B',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  amountRepaid: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  amountOverdue: {
    color: '#DC2626',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: '#EFF6FF',
  },
  statusPillOverdue: {
    backgroundColor: '#FEE2E2',
  },
  statusPillRepaid: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#2563EB',
  },
  statusDotOverdue: {
    backgroundColor: '#DC2626',
  },
  statusDotRepaid: {
    backgroundColor: '#64748B',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#2563EB',
  },
  statusTextOverdue: {
    color: '#DC2626',
  },
  statusTextRepaid: {
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    gap: 7,
  },
  actionButtonRepay: {
    backgroundColor: '#2563EB',
  },
  actionButtonUndo: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonTextMuted: {
    color: '#475569',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonHovered: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },

  /* Custom Delete Confirmation Modal Styles */
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
    marginBottom: 18,
  },
  modalRecordBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalRecordAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalRecordAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  modalRecordDetails: {
    flex: 1,
  },
  modalRecordName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalRecordDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalRecordAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
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
  modalDeleteBtn: {
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
  modalDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
});
