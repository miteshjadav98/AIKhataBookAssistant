import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "MitekOne — AI-Powered CRM & Business Management Platform",
  description:
    "MitekOne helps businesses manage customers, track credit & payments, monitor inventory, and grow smarter with AI. Start free today.",
};

const FEATURES = [
  {
    icon: "👥",
    title: "Customer Management",
    desc: "Add customers, track their khata, manage credit limits and view complete transaction history at a glance.",
  },
  {
    icon: "📒",
    title: "Credit & Payment Ledger",
    desc: "Record credit (udhar) and payments (jama) with automatic running balances and optional interest tracking.",
  },
  {
    icon: "📊",
    title: "Dashboard & Analytics",
    desc: "Real-time overview of revenue, dues, collections, and monthly performance with visual charts.",
  },
  {
    icon: "🧾",
    title: "Sales & Invoicing",
    desc: "Create sales, generate invoices, track order status, and manage customer billing end-to-end.",
  },
  {
    icon: "📦",
    title: "Inventory Management",
    desc: "Track stock levels across your product catalog, get low-stock alerts, and manage pricing.",
  },
  {
    icon: "🏭",
    title: "Supplier Management",
    desc: "Maintain supplier relationships, track purchase orders, and keep supplier ledgers organised.",
  },
  {
    icon: "📄",
    title: "Reports & Exports",
    desc: "Generate P&L statements, sales reports, and customer statements — exportable to PDF or Excel.",
  },
  {
    icon: "🤖",
    title: "AI Copilot",
    desc: "Ask anything about your business in plain English and get instant answers.",
  },
];

const CHART_HEIGHTS = [40, 65, 45, 80, 60, 90, 75];

export default function Home() {
  return (
    <div className={styles.page}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              ✨ AI-Powered CRM
            </div>
            <h1 className={styles.heroTitle}>
              Run Your Business<br />
              <span className="text-gradient">Smarter with AI</span>
            </h1>
            <p className={styles.heroSubtitle}>
              MitekOne combines the familiarity of a traditional ledger book with
              modern AI — manage customers, track payments, and grow your business with
              confidence.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/auth/register" className="btn-primary">
                Get Started Free&nbsp;<i className="fa-solid fa-arrow-right" />
              </Link>
              <Link href="/auth/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>500+</span>
                <span className={styles.heroStatLabel}>Businesses</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>10k+</span>
                <span className={styles.heroStatLabel}>Transactions</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>99.9%</span>
                <span className={styles.heroStatLabel}>Uptime</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>AI-First</span>
                <span className={styles.heroStatLabel}>Platform</span>
              </div>
            </div>
          </div>

          {/* Dashboard mockup — hidden on mobile */}
          <div className={styles.heroRight} aria-hidden="true">
            <div className={styles.dashboardCard}>
              <div className={styles.dashboardHeader}>
                <div className={styles.windowDots}>
                  <span className={styles.dot} style={{ background: "#ef4444" }} />
                  <span className={styles.dot} style={{ background: "#f59e0b" }} />
                  <span className={styles.dot} style={{ background: "#22c55e" }} />
                </div>
                <span className={styles.dashboardTitle}>MitekOne Dashboard</span>
              </div>
              <div className={styles.dashboardMetrics}>
                <div className={styles.dashboardMetric}>
                  <div className={styles.metricLabel}>Monthly Revenue</div>
                  <div className={`${styles.metricValue} ${styles.green}`}>₹2,45,000</div>
                  <div className={styles.metricTrend}>↑ 12% vs last month</div>
                </div>
                <div className={styles.dashboardMetric}>
                  <div className={styles.metricLabel}>Outstanding Due</div>
                  <div className={`${styles.metricValue} ${styles.orange}`}>₹38,500</div>
                  <div className={styles.metricTrend}>↓ 5% cleared this week</div>
                </div>
              </div>
              <div className={styles.dashboardChart}>
                {CHART_HEIGHTS.map((h, i) => (
                  <div key={i} className={styles.chartBarWrap}>
                    <div className={styles.chartBar} style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
              <div className={styles.dashboardCopilot}>
                <span className={styles.copilotEmoji}>🤖</span>
                <p className={styles.copilotBubble}>
                  &ldquo;Revenue is up 12%! Top customer: Ravi Trading Co. — ₹45k this month.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────── */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.sectionContainer}>
          <span className={styles.sectionBadge}>About Us</span>
          <h2 className={styles.sectionTitle}>
            Built for <span className="text-gradient">Indian Businesses</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            MitekOne was born from a simple idea: every small business deserves enterprise-grade
            tools without the complexity or cost. We combine traditional ledger simplicity with modern AI.
          </p>
          <div className={styles.aboutGrid}>
            {[
              {
                icon: "🎯",
                title: "Our Mission",
                desc: "Empower small and medium businesses with AI-driven tools that simplify operations, improve cash-flow visibility, and drive sustainable growth.",
              },
              {
                icon: "🌟",
                title: "Our Vision",
                desc: "To become the most trusted CRM for Indian businesses — blending traditional ledger simplicity with state-of-the-art AI capabilities.",
              },
              {
                icon: "💡",
                title: "Our Approach",
                desc: "We combine deep domain expertise with cutting-edge AI to deliver solutions that are intuitive, powerful, and affordable for every business.",
              },
            ].map((c) => (
              <div key={c.title} className={`${styles.aboutCard} glass-panel`}>
                <div className={styles.aboutIcon}>{c.icon}</div>
                <h3 className={styles.aboutCardTitle}>{c.title}</h3>
                <p className={styles.aboutCardText}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <span className={styles.sectionBadge}>Features</span>
          <h2 className={styles.sectionTitle}>
            Everything You Need to{" "}
            <span className="text-gradient">Run Your Business</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            From customer ledgers to AI-powered insights — all the tools you need, in one place.
          </p>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`${styles.featureCard} glass-panel`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureCardTitle}>{f.title}</h3>
                <p className={styles.featureCardText}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Copilot ────────────────────────────────────── */}
      <section id="ai-copilot" className={styles.copilotSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.copilotLayout}>
            <div className={styles.copilotLeft}>
              <span className={styles.sectionBadge}>AI Copilot</span>
              <h2 className={styles.sectionTitle}>
                Your Business Assistant,<br />
                <span className="text-gradient">Always On</span>
              </h2>
              <p className={styles.copilotDesc}>
                BizzChat, your MitekOne Copilot, understands your business data and
                answers questions in plain language — no dashboards to navigate, no reports to
                generate manually.
              </p>
              <ul className={styles.copilotList}>
                {[
                  "Ask about revenue, top customers, overdue payments",
                  "Get instant business insights and summaries",
                  "Raise and track support tickets through conversation",
                  "Receive actionable suggestions to improve cash flow",
                ].map((item) => (
                  <li key={item}>
                    <span className={styles.checkBadge}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="btn-primary">
                Try Copilot Free&nbsp;<i className="fa-solid fa-arrow-right" />
              </Link>
            </div>

            <div className={styles.copilotRight}>
              <div className={`${styles.chatWindow} glass-panel`}>
                <div className={styles.chatHeader}>
                  <span className={styles.chatBotEmoji}>🤖</span>
                  <div>
                    <div className={styles.chatBotName}>AI Copilot</div>
                    <div className={styles.chatBotStatus}>
                      <span className={styles.onlineDot} />Online
                    </div>
                  </div>
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.chatUser}>What&apos;s my revenue this month?</div>
                  <div className={styles.chatBot}>
                    Your revenue this month is <strong>₹2,45,000</strong> — up 12% from last
                    month. Top customer: <strong>Ravi Trading Co.</strong> (₹45,000).
                  </div>
                  <div className={styles.chatUser}>Who has dues older than 30 days?</div>
                  <div className={styles.chatBot}>
                    3 customers have 30+ day dues:{" "}
                    <strong>Sharma Stores</strong> (₹12k),{" "}
                    <strong>Patel Wholesale</strong> (₹8.5k),{" "}
                    <strong>Kumar Enterprises</strong> (₹6.2k).
                  </div>
                </div>
                <div className={styles.chatFooter}>
                  <span className={styles.chatPlaceholder}>Ask anything about your business…</span>
                  <button className={styles.chatSendBtn} aria-label="Send" disabled>
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About the Founder ─────────────────────────────── */}
      <section id="founder" className={styles.founderSection}>
        <div className={styles.sectionContainer}>
          <span className={styles.sectionBadge}>Meet the Founder</span>
          <h2 className={styles.sectionTitle}>
            The Mind Behind{" "}
            <span className="text-gradient">MitekOne</span>
          </h2>
          <div className={`${styles.founderCard} glass-panel`}>
            <div className={styles.founderAvatar}>MJ</div>
            <div className={styles.founderContent}>
              <h3 className={styles.founderName}>Mitesh Jadav</h3>
              <p className={styles.founderRole}>
                Backend &amp; Generative AI Engineer
              </p>
              <p className={styles.founderBio}>
                With 5+ years of experience building scalable backend systems and AI-powered
                applications, Mitesh created MitekOne to bridge the gap between
                traditional business practices and modern AI technology. His expertise in
                Node.js, Python, Azure, and Generative AI enables him to build systems that
                are both powerful and practical for everyday business needs.
              </p>
              <div className={styles.skillTags}>
                {[
                  "Node.js","Python","Azure Cloud","Generative AI",
                  "REST APIs","PostgreSQL","Redis","Agentic AI","LangChain"
                ].map((s) => (
                  <span key={s} className={styles.skillTag}>{s}</span>
                ))}
              </div>
              <div className={styles.founderLinks}>
                <a
                  href="https://linkedin.com/in/miteshjadavd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.founderLink}
                >
                  <i className="fa-brands fa-linkedin" /> LinkedIn
                </a>
                <a
                  href="https://github.com/miteshjadav98"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.founderLink}
                >
                  <i className="fa-brands fa-github" /> GitHub
                </a>
                <a href="mailto:jadavmitesh.jd@gmail.com" className={styles.founderLink}>
                  <i className="fa-solid fa-envelope" /> Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────── */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.sectionContainer}>
          <span className={styles.sectionBadge}>Contact Us</span>
          <h2 className={styles.sectionTitle}>
            Get in <span className="text-gradient">Touch</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Have questions, feedback, or want a demo? We would love to hear from you.
          </p>
          <div className={styles.contactLayout}>
            <div className={`${styles.contactInfo} glass-panel`}>
              <h3 className={styles.contactInfoTitle}>Contact Information</h3>
              <div className={styles.contactItems}>
                {[
                  {
                    icon: "fa-solid fa-envelope",
                    label: "Support Email",
                    text: "jadavmitesh.jd@gmail.com",
                    href: "mailto:jadavmitesh.jd@gmail.com",
                  },
                  {
                    icon: "fa-brands fa-linkedin",
                    label: "LinkedIn",
                    text: "linkedin.com/in/miteshjadavd",
                    href: "https://linkedin.com/in/miteshjadavd",
                    external: true,
                  },
                  {
                    icon: "fa-brands fa-github",
                    label: "GitHub",
                    text: "github.com/miteshjadav98",
                    href: "https://github.com/miteshjadav98",
                    external: true,
                  },
                ].map((item) => (
                  <div key={item.label} className={styles.contactItem}>
                    <div className={styles.contactItemIcon}>
                      <i className={item.icon} />
                    </div>
                    <div>
                      <div className={styles.contactItemLabel}>{item.label}</div>
                      <a
                        href={item.href}
                        className={styles.contactItemValue}
                        {...(item.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {item.text}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.responseNote}>
                <i className="fa-solid fa-clock" />
                <span>We typically respond within 24 hours</span>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className={styles.footerSection}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.footerLogo}>
                Mitek<span className="text-gradient">One</span>
              </Link>
              <p className={styles.footerTagline}>
                AI-Powered CRM &amp; Business Management Platform. Manage customers,
                track payments, and grow smarter.
              </p>
              <div className={styles.footerSocials}>
                <a
                  href="https://linkedin.com/in/miteshjadavd"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className={styles.socialIcon}
                >
                  <i className="fa-brands fa-linkedin" />
                </a>
                <a
                  href="https://github.com/miteshjadav98"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className={styles.socialIcon}
                >
                  <i className="fa-brands fa-github" />
                </a>
                <a
                  href="mailto:jadavmitesh.jd@gmail.com"
                  aria-label="Email"
                  className={styles.socialIcon}
                >
                  <i className="fa-solid fa-envelope" />
                </a>
              </div>
            </div>

            <div className={styles.footerLinks}>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Platform</h4>
                <a href="#features" className={styles.footerLink}>Features</a>
                <a href="#ai-copilot" className={styles.footerLink}>AI Copilot</a>
                <Link href="/auth/register" className={styles.footerLink}>Get Started</Link>
                <Link href="/auth/login" className={styles.footerLink}>Sign In</Link>
              </div>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Company</h4>
                <a href="#about" className={styles.footerLink}>About Us</a>
                <a href="#founder" className={styles.footerLink}>Our Founder</a>
                <a href="#contact" className={styles.footerLink}>Contact</a>
              </div>
              <div className={styles.footerCol}>
                <h4 className={styles.footerColTitle}>Support</h4>
                <a href="mailto:jadavmitesh.jd@gmail.com" className={styles.footerLink}>
                  Support Email
                </a>
                <Link href="/auth/customer-login" className={styles.footerLink}>
                  Customer Portal
                </Link>
                <a href="#contact" className={styles.footerLink}>Send Inquiry</a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>
              © {new Date().getFullYear()} MitekOne. Built with ❤️ by{" "}
              <strong>Mitesh Jadav</strong>.
            </p>
            <p>
              <a
                href="mailto:jadavmitesh.jd@gmail.com"
                className={styles.footerBottomLink}
              >
                jadavmitesh.jd@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
