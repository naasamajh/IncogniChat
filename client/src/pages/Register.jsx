import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiUserPlus, FiArrowLeft, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await register(formData);
      setEmail(formData.email);
      setStep(2);
      toast.success('OTP sent to your email! 📧');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOTP({ email, otp: otpString });
      toast.success(`Welcome to IncogniChat! Your anonymous name is: ${data.user.anonymousName} 🎭`, {
        duration: 5000
      });
      navigate('/chat');
    } catch (error) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const { authAPI } = await import('../services/api');
      await authAPI.resendOTP(email);
      toast.success('New OTP sent! Check your email 📧');
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-grid" />
      <div className="bg-glow-orb bg-glow-orb-1" />
      <div className="bg-glow-orb bg-glow-orb-2" />

      <motion.div 
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className="auth-back">
          <FiArrowLeft /> Back to Home
        </Link>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="register-form"
              className="auth-card glass-strong"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="auth-header">
                <motion.div 
                  className="auth-logo"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                >
                  🎭
                </motion.div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the anonymous chatroom community</p>
              </div>

              {/* Progress Steps */}
              <div className="progress-steps">
                <div className="progress-step active">
                  <div className="step-circle">1</div>
                  <span>Details</span>
                </div>
                <div className="progress-line" />
                <div className="progress-step">
                  <div className="step-circle">2</div>
                  <span>Verify</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="form-input with-icon"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="form-input with-icon"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrapper">
                      <FiLock className="input-icon" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        className="form-input with-icon"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <FiLock className="input-icon" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        className="form-input with-icon"
                        required
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary btn-lg auth-submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner spinner-sm" />
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <FiUserPlus />
                      Create Account
                    </>
                  )}
                </motion.button>
              </form>

              <div className="auth-footer">
                <p>Already have an account? <Link to="/login" className="auth-link">Log In</Link></p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-form"
              className="auth-card glass-strong"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="auth-header">
                <motion.div 
                  className="auth-logo"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  📧
                </motion.div>
                <h1 className="auth-title">Verify Email</h1>
                <p className="auth-subtitle">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
              </div>

              {/* Progress Steps */}
              <div className="progress-steps">
                <div className="progress-step completed">
                  <div className="step-circle"><FiCheck /></div>
                  <span>Details</span>
                </div>
                <div className="progress-line active" />
                <div className="progress-step active">
                  <div className="step-circle">2</div>
                  <span>Verify</span>
                </div>
              </div>

              <form onSubmit={handleVerifyOTP} className="auth-form">
                <div className="otp-container">
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="otp-input"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary btn-lg auth-submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner spinner-sm" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      <FiCheck />
                      Verify & Continue
                    </>
                  )}
                </motion.button>

                <div className="resend-section">
                  <p>Didn't receive the code?</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                  >
                    {resendLoading ? (
                      <><span className="spinner spinner-sm" /> Sending...</>
                    ) : (
                      <><FiRefreshCw /> Resend OTP</>
                    )}
                  </button>
                </div>
              </form>

              <div className="auth-footer">
                <button 
                  className="auth-link" 
                  onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-secondary)' }}
                >
                  ← Back to registration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
