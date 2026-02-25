import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { FiMessageCircle, FiShield, FiUsers, FiZap, FiLock, FiEye } from 'react-icons/fi';
import Scene3D from '../components/Scene3D';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiUsers />,
      title: 'Millions Connected',
      desc: 'Chat with people worldwide in a single global chatroom, all in real-time.'
    },
    {
      icon: <FiShield />,
      title: 'AI Content Shield',
      desc: 'Powered by Groq AI to filter harmful content and keep conversations safe.'
    },
    {
      icon: <FiLock />,
      title: '100% Anonymous',
      desc: 'Your identity is never revealed. Unique anonymous names protect your privacy.'
    },
    {
      icon: <FiZap />,
      title: 'Lightning Fast',
      desc: 'Built with WebSocket technology for instant message delivery.'
    },
    {
      icon: <FiEye />,
      title: 'Zero Tracking',
      desc: 'No personal data displayed. Chat freely without identity concerns.'
    },
    {
      icon: <FiMessageCircle />,
      title: 'Real-time Chat',
      desc: 'See messages, typing indicators, and online count instantly.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="landing-page">
      <Scene3D />
      <div className="bg-grid" />
      <div className="bg-glow-orb bg-glow-orb-1" />
      <div className="bg-glow-orb bg-glow-orb-2" />
      <div className="bg-glow-orb bg-glow-orb-3" />

      {/* Navbar */}
      <motion.nav 
        className="landing-nav glass"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="nav-brand">
          <span className="nav-logo">🎭</span>
          <span className="nav-title gradient-text">IncogniChat</span>
        </div>
        <div className="nav-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.div 
            className="hero-badge glass"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8, type: 'spring' }}
          >
            <span className="badge-dot" />
            <span>Anonymous · Secure · Real-time</span>
          </motion.div>

          <h1 className="hero-title">
            Chat with the World,
            <br />
            <span className="gradient-text">
              <TypeAnimation
                sequence={[
                  'Stay Anonymous',
                  2000,
                  'Stay Protected',
                  2000,
                  'Stay Connected',
                  2000,
                  'Stay Free',
                  2000,
                ]}
                wrapper="span"
                repeat={Infinity}
                speed={50}
              />
            </span>
          </h1>

          <p className="hero-subtitle">
            Join millions in the world's most secure anonymous chatroom. 
            Express yourself freely with AI-powered content moderation keeping everyone safe.
          </p>

          <div className="hero-cta">
            <motion.button 
              className="btn btn-primary btn-lg hero-btn"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiMessageCircle />
              Start Chatting Now
            </motion.button>
            <motion.button 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              I have an account
            </motion.button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number gradient-text">∞</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number gradient-text">AI</span>
              <span className="stat-label">Moderated</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number gradient-text">0ms</span>
              <span className="stat-label">Latency</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">
            Why <span className="gradient-text">IncogniChat</span>?
          </h2>
          <p className="section-subtitle">
            Built with cutting-edge technology to deliver the ultimate anonymous chat experience
          </p>
        </motion.div>

        <motion.div 
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card glass"
              variants={itemVariants}
              whileHover={{ 
                y: -8, 
                transition: { duration: 0.3 },
                boxShadow: '0 8px 40px rgba(124, 58, 237, 0.2)'
              }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="how-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">
            Get Started in <span className="gradient-text">3 Steps</span>
          </h2>
        </motion.div>

        <div className="steps-container">
          {[
            { num: '01', title: 'Create Account', desc: 'Sign up with your email and verify via OTP' },
            { num: '02', title: 'Get Anonymous Name', desc: 'Receive your unique anonymous identity' },
            { num: '03', title: 'Start Chatting', desc: 'Join the global chatroom and express freely' }
          ].map((step, i) => (
            <motion.div 
              key={i}
              className="step-card glass"
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              <div className="step-num gradient-text">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div 
          className="cta-card glass-strong"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Ready to Chat <span className="gradient-text">Anonymously</span>?</h2>
          <p>Join thousands of anonymous users worldwide. Your identity stays hidden.</p>
          <motion.button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/register')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Free Account
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="nav-logo">🎭</span>
            <span className="gradient-text">IncogniChat</span>
          </div>
          <p className="footer-text">© 2026 IncogniChat. Chat anonymously, safely, and freely.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
