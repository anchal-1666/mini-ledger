import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { requestOtp, loginWithOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [serverDebugOtp, setServerDebugOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits)');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await requestOtp(phoneNumber.trim());
      if (res.debugOtp) {
        setServerDebugOtp(res.debugOtp);
      }
      setStep('otp');
    } catch (error: any) {
      console.error('Send OTP error', error);
      setErrorMessage(
        error?.response?.data?.message || 'Failed to request OTP. Make sure backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const success = await loginWithOtp(phoneNumber.trim(), otp.trim());
      if (!success) {
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Verify OTP error', error);
      setErrorMessage(
        error?.response?.data?.message || 'Invalid or expired OTP. Please check the server logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (serverDebugOtp) {
      setOtp(serverDebugOtp);
    }
  };

  return (
    <View style={styles.backgroundBase}>
      {/* Decorative gradient layers with pointerEvents=none so touches never block */}
      <View style={styles.gradientLayer1} pointerEvents="none" />
      <View style={styles.gradientLayer2} pointerEvents="none" />
      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={styles.decorCircle2} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.contentWrap}>
            {/* Logo & Branding */}
            <View style={styles.brandContainer}>
              <View style={styles.logoGlow}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoImage}
                />
              </View>
              <Text style={styles.appTitle}>MiniLedger</Text>
              <Text style={styles.appSubtitle}>
                Smart, effortless tracking for money lent to friends
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              {/* Step indicator dots */}
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <View style={[styles.stepDot, step === 'otp' && styles.stepDotActive]} />
              </View>

              <Text style={styles.stepTitle}>
                {step === 'phone' ? 'Welcome Back' : 'Verify Phone'}
              </Text>
              <Text style={styles.stepDesc}>
                {step === 'phone'
                  ? 'Enter your phone number to receive a secure login code'
                  : `Enter the 6-digit code sent for ${phoneNumber}`}
              </Text>

              {/* Error banner (Red only for errors) */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <View style={styles.errorIconWrap}>
                    <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {step === 'phone' ? (
                // Step 1: Phone input
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="call-outline" size={18} color="#2563EB" />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={(val) => {
                        setPhoneNumber(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoFocus
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.btnDisabled]}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                        <View style={styles.btnArrow}>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // Step 2: OTP input
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>6-Digit Code</Text>
                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Ionicons name="key-outline" size={18} color="#2563EB" />
                    </View>
                    <TextInput
                      style={[styles.textInput, styles.otpInput]}
                      placeholder="• • • • • •"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={(val) => {
                        setOtp(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoFocus
                    />
                  </View>

                  {/* Mock OTP Log Banner */}
                  <View style={styles.mockOtpNotice}>
                    <View style={styles.mockHeaderRow}>
                      <Ionicons name="terminal-outline" size={15} color="#2563EB" />
                      <Text style={styles.mockNoticeTitle}>Server Console Log</Text>
                    </View>
                    <Text style={styles.mockNoticeText}>
                      The OTP was printed in your backend terminal.
                    </Text>
                    {serverDebugOtp ? (
                      <TouchableOpacity
                        style={styles.autoFillButton}
                        onPress={handleAutoFill}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="flash" size={13} color="#2563EB" />
                        <Text style={styles.autoFillButtonText}>
                          Auto-fill: {serverDebugOtp}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.btnDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Verify & Login</Text>
                        <View style={styles.btnArrow}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.otpActionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setStep('phone');
                        setOtp('');
                        setErrorMessage(null);
                      }}
                    >
                      <Text style={styles.linkText}>← Change Number</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                      <Text style={styles.resendText}>Resend Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              Secured with end-to-end encryption
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundBase: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  gradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#1E3A8A',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.5,
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  contentWrap: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: -36,
    marginBottom: 36,
  },
  logoGlow: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginTop: 2,
    marginBottom: 14,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(203, 213, 225, 0.85)',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#2563EB',
    width: 40,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    fontWeight: '600',
    lineHeight: 17,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
  },
  inputIconWrap: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  otpInput: {
    letterSpacing: 8,
    fontWeight: '800',
    fontSize: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockOtpNotice: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mockNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  mockNoticeText: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
  },
  autoFillButton: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoFillButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  linkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  resendText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.6)',
    marginTop: 24,
  },
});
