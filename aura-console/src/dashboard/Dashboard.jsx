import React, { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch } from "../api";
import { sendCopilotMessage } from "../core/advancedAiClient";
import IntegrationHealthPanel from "../components/IntegrationHealthPanel";

const DashboardCharts = lazy(() => import("./DashboardCharts"));

function Spinner() {
	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
			<div
				style={{
					width: 38,
					height: 38,
					border: "4px solid #7fffd4",
					borderTop: "4px solid #23263a",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
				}}
			/>
			<style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
		</div>
	);
}

const API_BASE = "https://aura-core-monolith.onrender.com";

// Quick action cards
const QuickActionCard = ({ icon, title, description, onClick, color = "#7fffd4" }) => (
	<div
		onClick={onClick}
		style={{
			background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
			border: "1px solid #2f3650",
			borderRadius: 16,
			padding: 20,
			cursor: "pointer",
			transition: "all 0.2s",
			display: "flex",
			flexDirection: "column",
			gap: 12,
		}}
		className="quick-action-card"
	>
		<div style={{ fontSize: 32 }}>{icon}</div>
		<div style={{ fontWeight: 700, color: "#e5e7eb", fontSize: 16 }}>{title}</div>
		<div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.4 }}>{description}</div>
	</div>
);

// Stat card component
const StatCard = ({ label, value, change, icon, trend = "up", subtitle = null, upgradeRequired = false, tooltip = null }) => (
	<div
		style={{
			background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
			border: "1px solid #2f3650",
			borderRadius: 16,
			padding: 24,
			display: "flex",
			flexDirection: "column",
			gap: 12,
			transition: "all 0.2s",
		}}
		className="stat-card"
	>
		<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
			<div style={{ flex: 1 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
					{label}
					{tooltip && (
						<span title={tooltip} style={{ cursor: "help", fontSize: 12, opacity: 0.7 }}>ℹ️</span>
					)}
				</div>
				<div style={{ fontSize: upgradeRequired ? 18 : 36, fontWeight: 900, color: upgradeRequired ? "#ff9800" : "#e5e7eb", marginTop: 8 }}>
					{value}
				</div>
				{subtitle && (
					<div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
						{subtitle}
					</div>
				)}
				{change && !upgradeRequired && (
					<div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
						<span style={{ color: trend === "up" ? "#22d37f" : "#ff4d4f", fontSize: 14, fontWeight: 700 }}>
							{trend === "up" ? "↑" : "↓"} {change}
						</span>
						<span style={{ fontSize: 12, color: "#64748b" }}>vs last period</span>
					</div>
				)}
				{upgradeRequired && (
					<div style={{ marginTop: 8 }}>
						<a 
							href="https://www.shopify.com/pricing" 
							target="_blank" 
							rel="noopener noreferrer"
							style={{ 
								fontSize: 12, 
								color: "#7fffd4", 
								textDecoration: "none",
								fontWeight: 600,
								display: "inline-flex",
								alignItems: "center",
								gap: 4
							}}
						>
							Upgrade to Shopify Plus →
						</a>
					</div>
				)}
			</div>
			{icon && <div style={{ fontSize: 40, opacity: 0.2 }}>{icon}</div>}
		</div>
	</div>
);

// Activity item
const ActivityItem = ({ icon, title, timestamp, type }) => (
	<div
		style={{
			display: "flex",
			gap: 12,
			padding: "12px 0",
			borderBottom: "1px solid #2f3650",
		}}
	>
		<div
			style={{
				width: 40,
				height: 40,
				borderRadius: 10,
				background: "#2f3650",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: 18,
			}}
		>
			{icon}
		</div>
		<div style={{ flex: 1 }}>
			<div style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 600 }}>{title}</div>
			<div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{timestamp}</div>
		</div>
		<div
			style={{
				fontSize: 11,
				color: "#94a3b8",
				background: "#2f3650",
				padding: "4px 8px",
				borderRadius: 6,
				height: "fit-content",
			}}
		>
			{type}
		</div>
	</div>
);

const Dashboard = ({ setActiveSection }) => {
	const [stats, setStats] = useState({
		products: null,
		seoIssues: null,
		revenue: null,
		orders: null,
		conversion: null,
		visitors: null,
		visitorsUpgradeRequired: false,
		aov: null,
	});
	const [previousStats, setPreviousStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [copilotInput, setCopilotInput] = useState("");
	const [copilotReply, setCopilotReply] = useState("");
	const [copilotLoading, setCopilotLoading] = useState(false);
	const [shop, setShop] = useState(null);
	const [timePeriod, setTimePeriod] = useState(30); // 7, 30, or 90 days
	const [recentActivity, setRecentActivity] = useState([]);
	const [topProducts, setTopProducts] = useState([]);
	const [underperformingProducts, setUnderperformingProducts] = useState([]);
	const [healthScore, setHealthScore] = useState(null);
	const [recommendations, setRecommendations] = useState([]);
	const [goals, setGoals] = useState(() => {
		const saved = localStorage.getItem('dashboardGoals');
		return saved ? JSON.parse(saved) : { revenue: 10000, orders: 100, conversion: 5 };
	});
	const [alerts, setAlerts] = useState([]);
	const [toasts, setToasts] = useState([]);
	const [scanningInProgress, setScanningInProgress] = useState(false);
	const [lastScanTime, setLastScanTime] = useState(null);
	const [scanEstimatedTime, setScanEstimatedTime] = useState(0);
	const [scanRemainingTime, setScanRemainingTime] = useState(0);
	const [crawlResults, setCrawlResults] = useState(null);
	const [showScanModal, setShowScanModal] = useState(false);
	const [scanningPage, setScanningPage] = useState('');
	const [scanLog, setScanLog] = useState([]);

	const fetchStats = async (period = timePeriod) => {
		setLoading(true);
		try {
			const projectId = localStorage.getItem("auraProjectId");
			
			// Initialize stats object
			const newStats = {
				products: null,
				seoIssues: null,
				revenue: null,
				orders: null,
				conversion: null,
				visitors: null,
			};

			// Fetch products count
			if (projectId) {
				const prodRes = await fetch(`${API_BASE}/projects/${projectId}/drafts`);
				if (prodRes.ok) {
					const prodData = await prodRes.json();
					newStats.products = Array.isArray(prodData) ? prodData.length : prodData.items ? prodData.items.length : null;
				}
				const fixRes = await fetch(`${API_BASE}/projects/${projectId}/fix-queue`);
				if (fixRes.ok) {
					const fixData = await fixRes.json();
					newStats.seoIssues = fixData.counts && fixData.counts.open ? fixData.counts.open : 0;
				}
			}

			// Fetch real Shopify analytics data
			try {
				// Revenue (period-aware in future - for now just current month)
				const revenueRes = await apiFetch("/api/analytics/revenue");
				if (revenueRes.value !== null && revenueRes.value !== undefined) {
					newStats.revenue = `$${Number(revenueRes.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
					newStats.revenueRaw = Number(revenueRes.value);
				}

				// Orders count
				const ordersRes = await apiFetch("/api/analytics/orders");
				if (ordersRes.value !== null && ordersRes.value !== undefined) {
					newStats.orders = ordersRes.value;
				}

				// Try to fetch actual traffic/visitor data (only available on Shopify Plus/Advanced)
				const trafficRes = await apiFetch("/api/analytics/traffic");
				if (trafficRes.value !== null && trafficRes.value !== undefined) {
					// Real traffic data available
					newStats.visitors = trafficRes.value >= 1000 
						? `${(trafficRes.value / 1000).toFixed(1)}K` 
						: trafficRes.value;
					newStats.visitorsUpgradeRequired = false;
				} else if (trafficRes.error && trafficRes.error.toLowerCase().includes('plus')) {
					// Traffic data requires Shopify Plus/Advanced plan
					newStats.visitors = "Upgrade Required";
					newStats.visitorsUpgradeRequired = true;
				} else {
					// Fallback: estimate from customers if traffic API not available
					const customersRes = await apiFetch("/api/analytics/customers");
					if (customersRes.value !== null && customersRes.value !== undefined) {
						const estimatedVisitors = customersRes.value * 5;
						newStats.visitors = estimatedVisitors >= 1000 
							? `~${(estimatedVisitors / 1000).toFixed(1)}K*` 
							: `~${estimatedVisitors}*`;
						newStats.visitorsUpgradeRequired = false;
					}
				}

				// Calculate conversion rate (orders / visitors)
				if (newStats.orders && newStats.visitors && !newStats.visitorsUpgradeRequired) {
					const visitorsStr = String(newStats.visitors).replace('~', '').replace('*', '');
					const visitors = visitorsStr.includes('K')
						? parseFloat(visitorsStr) * 1000
						: parseFloat(visitorsStr);
					if (!isNaN(visitors) && visitors > 0) {
						const conversionRate = (newStats.orders / visitors) * 100;
						newStats.conversion = `${conversionRate.toFixed(1)}%`;
					}
				}

				// Calculate Average Order Value (AOV)
				if (newStats.revenueRaw && newStats.orders && newStats.orders > 0) {
					const aovValue = newStats.revenueRaw / newStats.orders;
					newStats.aov = `$${aovValue.toFixed(2)}`;
				}

				// Fetch recent orders for activity feed
				try {
					const ordersDetailRes = await apiFetch("/api/analytics/orders?limit=5&details=true");
					if (ordersDetailRes.orders && Array.isArray(ordersDetailRes.orders)) {
						const activities = ordersDetailRes.orders.map((order, idx) => ({
							icon: "🛒",
							title: `Order #${order.order_number || order.id || idx + 1}`,
							timestamp: order.created_at ? new Date(order.created_at).toLocaleString() : "Recently",
							type: "Order",
						}));
						setRecentActivity(activities.length > 0 ? activities : [
							{ icon: "📦", title: "No recent orders", timestamp: "—", type: "Info" }
						]);
					} else {
						// Fallback to generic activity
						setRecentActivity([
							{ icon: "📦", title: "Awaiting order data", timestamp: "—", type: "Info" }
						]);
					}
				} catch (ordersErr) {
					console.warn("Failed to fetch recent orders:", ordersErr);
					setRecentActivity([
						{ icon: "⚠️", title: "Unable to load recent activity", timestamp: "—", type: "Error" }
					]);
				}

				// Fetch top products and find underperforming ones
				try {
					const productsRes = await apiFetch("/api/product-seo/shopify-products?limit=20");
					if (productsRes && Array.isArray(productsRes)) {
						setTopProducts(productsRes.slice(0, 5));
						// Underperforming: products with low price or missing info
						const underperforming = productsRes
							.filter(p => {
								const price = p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : 0;
								return price < 10 || !p.images || p.images.length === 0 || !p.body_html;
							})
							.slice(0, 5);
						setUnderperformingProducts(underperforming);
					} else {
						setTopProducts([]);
						setUnderperformingProducts([]);
					}
				} catch (prodErr) {
					console.warn("Failed to fetch products:", prodErr);
					setTopProducts([]);
					setUnderperformingProducts([]);
				}

			} catch (analyticsError) {
				console.warn("Failed to fetch Shopify analytics:", analyticsError);
				// Leave null if analytics fail
			}

			// Calculate health score
			calculateHealthScore(newStats);

			// Generate recommendations
			generateRecommendations(newStats);

			// Check for alerts
			checkAlerts(newStats);

			// Store for comparison
			if (!previousStats && newStats.revenue) {
				setPreviousStats(newStats);
			}

			setStats(newStats);
		} catch (e) {
			console.error("Failed to fetch dashboard stats:", e);
			setStats({
				products: "—",
				seoIssues: "—",
				revenue: "—",
				orders: "—",
				conversion: "—",
				visitors: "—",
			});
		} finally {
			setLoading(false);
		}
	};

	const calculateHealthScore = (statsData) => {
		let score = 100;
		let grade = "A";
		
		// Deduct points for SEO issues
		if (statsData.seoIssues > 20) score -= 30;
		else if (statsData.seoIssues > 10) score -= 15;
		else if (statsData.seoIssues > 5) score -= 5;
		
		// Deduct points for low revenue
		if (statsData.revenueRaw !== undefined && statsData.revenueRaw !== null) {
			if (statsData.revenueRaw < 1000) score -= 20;
			else if (statsData.revenueRaw < 5000) score -= 10;
		} else {
			score -= 15; // No revenue data
		}
		
		// Deduct points for low orders
		if (statsData.orders !== undefined && statsData.orders !== null) {
			if (statsData.orders < 10) score -= 15;
			else if (statsData.orders < 50) score -= 8;
		} else {
			score -= 10; // No orders data
		}
		
		// Determine grade
		if (score >= 90) grade = "A";
		else if (score >= 80) grade = "B";
		else if (score >= 70) grade = "C";
		else if (score >= 60) grade = "D";
		else grade = "F";
		
		setHealthScore({ score: Math.max(score, 0), grade });
	};

	const generateRecommendations = (statsData) => {
		const recs = [];
		// SEO Issues - trigger if any issues exist (lowered threshold for dev stores)
		if (statsData.seoIssues >= 1) {
			recs.push({ icon: "🔍", text: "You have " + statsData.seoIssues + " SEO issue" + (statsData.seoIssues > 1 ? "s" : "") + ". Fix them to improve search rankings.", action: "Fix SEO Issues", link: "seo" });
		}
		// Conversion - trigger if 0% or undefined or < 2%
		if (!statsData.conversion || statsData.conversion === "0%" || parseFloat(statsData.conversion) < 2) {
			recs.push({ icon: "📈", text: "Low conversion rate. Consider A/B testing your product pages and improving CTAs.", action: "Optimize Conversion", link: "tools" });
		}
		// Low orders
		if (statsData.orders < 10) {
			recs.push({ icon: "📧", text: "Boost sales with targeted email campaigns to your customers.", action: "Create Campaign", link: "tools" });
		}
		// Underperforming products
		if (underperformingProducts.length > 0) {
			recs.push({ icon: "⚠️", text: underperformingProducts.length + " product" + (underperformingProducts.length > 1 ? "s" : "") + " need attention (low price or missing data).", action: "View Products", link: "products" });
		}
		setRecommendations(recs.slice(0, 3));
	};

	const checkAlerts = (statsData) => {
		const newAlerts = [];
		if (previousStats) {
			if (statsData.revenueRaw && previousStats.revenueRaw && statsData.revenueRaw < previousStats.revenueRaw * 0.8) {
				newAlerts.push({ type: "warning", message: "Revenue dropped 20%+ vs last check" });
			}
			if (statsData.orders && previousStats.orders && statsData.orders < previousStats.orders * 0.7) {
				newAlerts.push({ type: "danger", message: "Orders dropped 30%+ vs last check" });
			}
		}
		setAlerts(newAlerts);
	};

	const calculateChange = (current, previous) => {
		if (!previous || !current || isNaN(parseFloat(current)) || isNaN(parseFloat(previous))) return null;
		const change = ((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100;
		return { value: Math.abs(change).toFixed(1) + "%", trend: change >= 0 ? "up" : "down" };
	};

	const saveGoals = (newGoals) => {
		setGoals(newGoals);
		localStorage.setItem('dashboardGoals', JSON.stringify(newGoals));
	};

	const exportStats = () => {
		const csv = [
			["Metric", "Value"],
			["Revenue", stats.revenue || "N/A"],
			["Orders", stats.orders !== null ? stats.orders : "N/A"],
			["Conversion Rate", stats.conversion || "N/A"],
			["Visitors", stats.visitors || "N/A"],
			["Products", stats.products !== null ? stats.products : "N/A"],
			["SEO Issues", stats.seoIssues !== null ? stats.seoIssues : "N/A"],
			["Health Score", healthScore ? `${healthScore.grade} (${healthScore.score})` : "N/A"],
		].map(row => row.join(",")).join("\n");
		
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `dashboard-stats-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const showToast = (message, type = 'success') => {
		const id = Date.now();
		setToasts(prev => [...prev, { id, message, type }]);
		setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
	};

	const runSeoScan = async () => {
		if (scanningInProgress) return;

		setScanningInProgress(true);
		setShowScanModal(true);
		setCrawlResults(null);
		setScanLog([]);
		setScanningPage('');

		try {
			const sessionRes = await apiFetch('/api/session');
			const session = await sessionRes.json();

			if (!session.ok || !session.shop) {
				showToast('Unable to determine shop URL. Please connect your Shopify store in Settings.', 'error');
				setScanningInProgress(false);
				setShowScanModal(false);
				return;
			}

			const shopUrl = session.shop.includes('http') ? session.shop : `https://${session.shop}`;

			const projectId = localStorage.getItem("auraProjectId");
			let productCount = stats.products || 10;
			if (projectId) {
				try {
					const projectRes = await apiFetch(`/api/projects/${projectId}/drafts`);
					if (projectRes.ok) {
						const projectData = await projectRes.json();
						if (projectData.drafts && Array.isArray(projectData.drafts)) productCount = projectData.drafts.length;
					}
				} catch (e) { /* ignore */ }
			}

			const estimatedSeconds = Math.max(30, 30 + (productCount * 2.5));
			setScanEstimatedTime(estimatedSeconds);
			setScanRemainingTime(estimatedSeconds);

			// Animate scanning pages in the modal while the real request runs
			const fakePaths = ['/', '/collections', '/products', '/collections/all', '/pages/about', '/blogs/news', '/collections/featured', '/pages/contact', '/policies/privacy-policy', '/cart', '/search', '/pages/faq', '/collections/sale', '/products/featured', '/pages/shipping'];
			let fakeIdx = 0;
			const fakeTimer = setInterval(() => {
				const path = fakePaths[fakeIdx % fakePaths.length];
				const url = shopUrl + path;
				setScanningPage(url);
				setScanLog(prev => [...prev.slice(-12), { url, status: 'scanning' }]);
				fakeIdx++;
			}, 1200);

			const response = await apiFetch('/api/tools/seo-site-crawler/crawl', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: shopUrl })
			});

			clearInterval(fakeTimer);

			if (!response.ok) {
				let errorMsg = 'Unknown error';
				try { const e = await response.json(); errorMsg = e.error || errorMsg; } catch { errorMsg = response.statusText || `HTTP ${response.status}`; }
				showToast('Scan failed: ' + errorMsg, 'error');
				setScanningInProgress(false);
				setShowScanModal(false);
				setScanRemainingTime(0);
				return;
			}

			const result = await response.json();

			if (result.ok) {
				const scanData = result.result;
				const ts = new Date().toLocaleTimeString();
				setLastScanTime(ts);
				setCrawlResults(scanData);
				setStats(prev => ({ ...prev, seoIssues: scanData.totalIssues || 0 }));
				setScanningInProgress(false);
				setScanRemainingTime(0);
				// modal stays open to show results
			} else {
				showToast('Scan failed: ' + (result.error || 'Unknown error'), 'error');
				setScanningInProgress(false);
				setShowScanModal(false);
				setScanRemainingTime(0);
			}
		} catch (error) {
			console.error('SEO scan error:', error);
			showToast('Failed to start SEO scan. Please try again.', 'error');
			setScanningInProgress(false);
			setShowScanModal(false);
	};

	useEffect(() => {
		fetchStats();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [timePeriod]);

	// Auto-refresh every 30 seconds
	useEffect(() => {
		if (!autoRefresh) return;
		const interval = setInterval(() => {
			fetchStats();
		}, 30000);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoRefresh, timePeriod]);

	// Scan countdown timer
	useEffect(() => {
		if (!scanningInProgress || scanRemainingTime <= 0) {
			if (scanningInProgress && scanRemainingTime <= 0) {
				// Scan complete
				setScanningInProgress(false);
				setScanRemainingTime(0);
				// Refresh stats to show new SEO issues
				fetchStats();
			}
			return;
		}
		
		const timer = setInterval(() => {
			setScanRemainingTime(prev => {
				if (prev <= 1) {
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		
		return () => clearInterval(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scanningInProgress, scanRemainingTime]);

	useEffect(() => {
		async function fetchShop() {
			try {
				const res = await apiFetch("/api/session");
				if (res.ok) {
					const data = await res.json();
					if (data && data.projectDetails) {
						setShop(data.projectDetails);
					} else {
						setShop(null);
					}
				}
			} catch {
				setShop(null);
			}
		}
		fetchShop();
	}, []);

	// Skeleton loading component
	const SkeletonCard = () => (
		<div
			className="stat-card"
			style={{
				background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
				border: "1px solid #2f3650",
				borderRadius: 16,
				padding: 20,
				minHeight: 120,
			}}
		>
			<div style={{ 
				height: 16, 
				width: "60%", 
				background: "linear-gradient(90deg, #2f3650 0%, #3a4565 50%, #2f3650 100%)",
				backgroundSize: "200% 100%",
				animation: "shimmer 1.5s infinite",
				borderRadius: 4,
				marginBottom: 12,
			}} />
			<div style={{ 
				height: 32, 
				width: "40%", 
				background: "linear-gradient(90deg, #2f3650 0%, #3a4565 50%, #2f3650 100%)",
				backgroundSize: "200% 100%",
				animation: "shimmer 1.5s infinite",
				borderRadius: 4,
			}} />
		</div>
	);

	if (loading) {
		return (
			<div className="aura-dashboard-shell" style={{ padding: "24px", background: "#0f172a", minHeight: "100vh" }}>
				<style>{`
					@keyframes shimmer {
						0% { background-position: 200% 0; }
						100% { background-position: -200% 0; }
					}
				`}</style>
				<div style={{ marginBottom: 32 }}>
					<h1 style={{ fontSize: 32, fontWeight: 900, color: "#e5e7eb", margin: 0 }}>
						Loading Dashboard...
					</h1>
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
				</div>
			</div>
		);
	}

	if (!shop) {
		return (
			<div className="aura-dashboard-shell">
				<div style={{ color: "#ff4d4f", textAlign: "center", fontWeight: 700, fontSize: 18, margin: "48px 0" }}>
					Error: No shop data available. Please check your backend or session.
				</div>
			</div>
		);
	}

	const copilotUserId = shop.id || shop.domain || "dashboard-user";

	const handleCopilotAsk = async () => {
		if (!copilotInput.trim()) return;
		setCopilotLoading(true);
		try {
			const res = await sendCopilotMessage(copilotUserId, copilotInput.trim());
			setCopilotReply(res.reply || "");
			setCopilotInput("");
		} catch (err) {
			setCopilotReply(err.message || "Failed to fetch copilot reply");
		} finally {
			setCopilotLoading(false);
		}
	};

	return (
		<div className="aura-dashboard-shell" style={{ padding: "24px", background: "#0f172a", minHeight: "100vh" }}>
			<style>{`
				.quick-action-card:hover {
					transform: translateY(-4px);
					box-shadow: 0 8px 24px rgba(127, 255, 212, 0.15);
					border-color: #7fffd4;
				}
				.stat-card:hover {
					box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
					border-color: #3a4565;
				}
				
				/* Mobile Responsive Styles */
				@media (max-width: 768px) {
					.aura-dashboard-shell {
						padding: 16px !important;
					}
					.aura-dashboard-shell h1 {
						font-size: 24px !important;
					}
					.aura-dashboard-shell h2 {
						font-size: 18px !important;
					}
					.aura-dashboard-shell h3 {
						font-size: 16px !important;
					}
					/* Stack header controls vertically on mobile */
					.aura-dashboard-shell > div:first-child > div:first-child {
						flex-direction: column !important;
						align-items: flex-start !important;
					}
					/* Make chart grid single column on mobile */
					.aura-dashboard-shell > div:nth-child(10) {
						grid-template-columns: 1fr !important;
					}
					/* Ensure stat cards are full width on small screens */
					.stat-card {
						min-width: 100% !important;
					}
				}
				
				@media (max-width: 480px) {
					.aura-dashboard-shell {
						padding: 12px !important;
					}
					.stat-card {
						padding: 16px !important;
					}
					.stat-card > div > div:first-child {
						font-size: 11px !important;
					}
					.stat-card > div > div:nth-child(2) {
						font-size: 28px !important;
					}
				}
				.aura-toast { animation: toastIn 0.3s ease; }
				@keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
					.seo-issue-row:hover { background: #161d2e !important; transform: translateX(2px); }
			@keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
			@keyframes scanSlide { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
			@keyframes modalIn { from{opacity:0;transform:scale(0.96);} to{opacity:1;transform:scale(1);} }
			`}</style>

			{/* SEO Scan Modal */}
			{showScanModal && (
				<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
					<div style={{ background:'#1a1d2e', border:'1px solid #2f3650', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'88vh', display:'flex', flexDirection:'column', animation:'modalIn 0.25s ease' }}>
						{/* Modal header */}
						<div style={{ padding:'24px 28px 20px', borderBottom:'1px solid #2f3650', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
							<div style={{ display:'flex', alignItems:'center', gap:14 }}>
								{scanningInProgress ? (
									<div style={{ width:36, height:36, border:'3px solid #7fffd4', borderTop:'3px solid transparent', borderRadius:'50%', animation:'spin 0.9s linear infinite', flexShrink:0 }} />
								) : (
									<span style={{ fontSize:32 }}>✅</span>
								)}
								<div>
									<h2 style={{ color:'#e5e7eb', fontWeight:800, fontSize:20, margin:0 }}>
										{scanningInProgress ? 'Scanning your site...' : `Scan Complete — ${crawlResults?.totalIssues || 0} Issues Found`}
									</h2>
									<p style={{ color:'#94a3b8', fontSize:13, margin:'3px 0 0 0' }}>
										{scanningInProgress
											? `Checking pages for SEO issues — this takes a minute or two`
											: `${crawlResults?.pagesScanned} pages scanned • ${crawlResults?.high} high • ${crawlResults?.medium} medium • ${crawlResults?.low} low`}
									</p>
								</div>
							</div>
							{!scanningInProgress && (
								<button onClick={() => setShowScanModal(false)} style={{ background:'#2f3650', border:'none', color:'#94a3b8', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:600 }}>Close</button>
							)}
						</div>

						{/* Scanning progress view */}
						{scanningInProgress && (
							<div style={{ padding:'20px 28px', flex:1, overflowY:'auto' }}>
								<div style={{ background:'#0f172a', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
									<span style={{ width:8, height:8, background:'#7fffd4', borderRadius:'50%', animation:'pulse-dot 1s ease infinite', flexShrink:0 }} />
									<span style={{ color:'#7fffd4', fontSize:13, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
										{scanningPage || 'Initialising scanner...'}
									</span>
								</div>
								<div style={{ display:'flex', flexDirection:'column', gap:6 }}>
									{[...scanLog].reverse().map((entry, i) => (
										<div key={i} style={{ display:'flex', alignItems:'center', gap:10, animation:'scanSlide 0.3s ease', opacity: i === 0 ? 1 : Math.max(0.2, 1 - i * 0.07) }}>
											<span style={{ fontSize:11, color:'#475569', fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{entry.url}</span>
											<span style={{ fontSize:11, color:'#4ade80', flexShrink:0 }}>✓ scanned</span>
										</div>
									))}
								</div>
								{scanRemainingTime > 0 && (
									<div style={{ marginTop:20, textAlign:'center', color:'#475569', fontSize:13 }}>
										Estimated time remaining: <span style={{ color:'#94a3b8', fontWeight:600 }}>{Math.floor(scanRemainingTime/60)}:{String(scanRemainingTime%60).padStart(2,'0')}</span>
									</div>
								)}
							</div>
						)}

						{/* Results view */}
						{!scanningInProgress && crawlResults && (
							<div style={{ flex:1, overflowY:'auto', padding:'0 28px 24px' }}>
								{/* Severity badges */}
								<div style={{ display:'flex', gap:10, padding:'16px 0', flexWrap:'wrap' }}>
									<span style={{ background:'#2d1515', border:'1px solid #e53e3e', color:'#fc8181', padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>🔴 {crawlResults.high} High</span>
									<span style={{ background:'#2d2210', border:'1px solid #f59e0b', color:'#fbbf24', padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>🟡 {crawlResults.medium} Medium</span>
									<span style={{ background:'#1a2315', border:'1px solid #4ade80', color:'#86efac', padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>🟢 {crawlResults.low} Low</span>
									<span style={{ marginLeft:'auto', color:'#475569', fontSize:13, alignSelf:'center' }}>{crawlResults.pagesScanned} pages scanned • {lastScanTime}</span>
								</div>
								{crawlResults.totalIssues === 0 ? (
									<div style={{ textAlign:'center', padding:'48px 0', color:'#7fffd4', fontSize:16 }}>✅ No SEO issues found — your site looks great!</div>
								) : (
									<div style={{ display:'flex', flexDirection:'column', gap:8 }}>
										{crawlResults.issues.map((issue, i) => (
											<div key={i}
												onClick={() => { if (issue.fix && setActiveSection) { setActiveSection(issue.fix); setShowScanModal(false); } }}
												className="seo-issue-row"
												style={{ background:'#0f172a', border:`1px solid ${issue.severity==='high'?'#e53e3e':issue.severity==='medium'?'#f59e0b':'#4ade80'}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12, cursor: issue.fix ? 'pointer' : 'default' }}>
												<span style={{ fontSize:16, marginTop:1 }}>{issue.severity==='high'?'🔴':issue.severity==='medium'?'🟡':'🟢'}</span>
												<div style={{ flex:1, minWidth:0 }}>
													<div style={{ color:'#e5e7eb', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
														{issue.type}
														{issue.fix && <span style={{ fontSize:11, color:'#7fffd4', background:'rgba(127,255,212,0.1)', border:'1px solid rgba(127,255,212,0.3)', borderRadius:4, padding:'1px 7px', fontWeight:500 }}>Click to fix →</span>}
													</div>
													<div style={{ color:'#94a3b8', fontSize:13, marginTop:2 }}>{issue.detail}</div>
													<div style={{ color:'#475569', fontSize:12, marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{issue.page}</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Toast Notifications */}
			<div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
				{toasts.map(toast => (
					<div key={toast.id} className="aura-toast" style={{
						background: toast.type === 'error' ? "#2d1515" : "#0f2d24",
						border: `1px solid ${toast.type === 'error' ? '#e53e3e' : '#7fffd4'}`,
						borderRadius: 12,
						padding: "14px 20px",
						color: toast.type === 'error' ? '#fc8181' : '#7fffd4',
						fontSize: 14,
						fontWeight: 500,
						maxWidth: 360,
						boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
						display: "flex",
						alignItems: "center",
						gap: 10,
					}}>
						<span style={{ fontSize: 18 }}>{toast.type === 'error' ? '⚠️' : '✅'}</span>
						<span>{toast.message}</span>
						<button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
							style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 0 0 8px", opacity: 0.7 }}>×</button>
					</div>
				))}
			</div>

			{/* Header */}
			<div style={{ marginBottom: 32 }}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
						<img src="/logo-aura.png" alt="AURA" style={{ height: 48, width: 48, objectFit: "contain", borderRadius: 12 }} />
						<div>
							<h1 style={{ fontSize: 32, fontWeight: 900, color: "#e5e7eb", margin: 0, letterSpacing: "-0.02em" }}>
								Dashboard Overview
							</h1>
							<p style={{ fontSize: 14, color: "#94a3b8", margin: "4px 0 0 0" }}>
								{shop.name || "My Store"} • {shop.domain || "—"}
							</p>
						</div>
					</div>
					<div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
						{/* Time Period Selector */}
						<select
							value={timePeriod}
							onChange={(e) => setTimePeriod(Number(e.target.value))}
							style={{
								background: "#1a1d2e",
								border: "1px solid #2f3650",
								borderRadius: 8,
								padding: "10px 16px",
								color: "#e5e7eb",
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
								outline: "none",
							}}
						>
							<option value={7}>Last 7 Days</option>
							<option value={30}>Last 30 Days</option>
							<option value={90}>Last 90 Days</option>
						</select>
						{/* Auto-refresh Toggle */}
						<button
							onClick={() => setAutoRefresh(!autoRefresh)}
							style={{
								background: autoRefresh ? "#7fffd4" : "#1a1d2e",
								border: "1px solid #2f3650",
								borderRadius: 8,
								padding: "10px 16px",
								color: autoRefresh ? "#0f172a" : "#7fffd4",
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: 6,
							}}
							title={autoRefresh ? "Auto-refresh ON (30s)" : "Auto-refresh OFF"}
						>
							🔄 {autoRefresh ? "ON" : "OFF"}
						</button>
						{/* Refresh Button */}
						<button
							onClick={() => fetchStats()}
							style={{
								background: "#1a1d2e",
								border: "1px solid #2f3650",
								borderRadius: 8,
								padding: "10px 16px",
								color: "#7fffd4",
								fontSize: 18,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "all 0.2s",
							}}
							title="Refresh Data"
						>
							↻
						</button>
						{/* Export CSV Button */}
						<button
							onClick={exportStats}
							style={{
								background: "#7fffd4",
								border: "none",
								borderRadius: 8,
								padding: "10px 20px",
								color: "#0f172a",
								fontSize: 14,
								fontWeight: 700,
								cursor: "pointer",
								transition: "all 0.2s",
							}}
							title="Export Stats to CSV"
						>
							📊 Export CSV
						</button>
					</div>
				</div>
			</div>

			{/* AI Copilot Section */}
			<div
				style={{
					background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
					border: "1px solid #2f3650",
					borderRadius: 16,
					padding: 24,
					marginBottom: 32,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
					<div style={{ fontSize: 28 }}>🤖</div>
					<h2 style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb", margin: 0 }}>AI Copilot Assistant</h2>
				</div>
				<div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
					<input
						value={copilotInput}
						onChange={(e) => setCopilotInput(e.target.value)}
						placeholder="Ask me anything about your store, SEO, marketing strategies..."
						onKeyPress={(e) => e.key === "Enter" && handleCopilotAsk()}
						style={{
							flex: 1,
							borderRadius: 10,
							padding: "14px 16px",
							border: "2px solid #2f3650",
							background: "#0f1324",
							color: "#e5e7eb",
							fontSize: 15,
							outline: "none",
						}}
					/>
					<button
						onClick={handleCopilotAsk}
						disabled={copilotLoading}
						style={{
							background: copilotLoading ? "#3a3f55" : "#7fffd4",
							color: "#0f172a",
							border: "none",
							borderRadius: 10,
							fontWeight: 800,
							padding: "14px 24px",
							cursor: copilotLoading ? "wait" : "pointer",
							minWidth: 100,
							fontSize: 15,
							transition: "all 0.2s",
						}}
					>
						{copilotLoading ? "⏳ Thinking..." : "✨ Ask"}
					</button>
				</div>
				{copilotReply && (
					<div
						style={{
							marginTop: 16,
							padding: 16,
							background: "#0f1324",
							borderRadius: 10,
							border: "1px solid #2f3650",
						}}
					>
						<div style={{ fontSize: 12, color: "#7fffd4", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
							AI Response
						</div>
						<div style={{ color: "#e5e7eb", fontSize: 14, lineHeight: 1.6 }}>{copilotReply}</div>
					</div>
				)}
			</div>

			{/* Alerts Banner */}
			{alerts.length > 0 && (
				<div style={{ marginBottom: 24 }}>
					{alerts.map((alert, idx) => (
						<div
							key={idx}
							style={{
								background: alert.type === "danger" ? "rgba(239, 68, 68, 0.1)" : "rgba(251, 191, 36, 0.1)",
								border: `1px solid ${alert.type === "danger" ? "#ef4444" : "#fbbf24"}`,
								borderRadius: 12,
								padding: "12px 16px",
								marginBottom: 12,
								display: "flex",
								alignItems: "center",
								gap: 12,
							}}
						>
							<span style={{ fontSize: 20 }}>{alert.type === "danger" ? "🚨" : "⚠️"}</span>
							<span style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 600 }}>{alert.message}</span>
						</div>
					))}
				</div>
			)}

			{/* Recommendations Panel */}
			{recommendations.length > 0 && (
				<div
					style={{
						background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
						border: "1px solid #2f3650",
						borderRadius: 16,
						padding: 24,
						marginBottom: 32,
					}}
				>
					<h3 style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb", margin: "0 0 16px 0" }}>
						💡 Smart Recommendations
					</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{recommendations.map((rec, idx) => (
							<div
								key={idx}
								style={{
									background: "#0f1324",
									border: "1px solid #2f3650",
									borderRadius: 10,
									padding: 16,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: 16,
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
									<span style={{ fontSize: 24 }}>{rec.icon}</span>
									<span style={{ color: "#e5e7eb", fontSize: 14 }}>{rec.text}</span>
								</div>
								<button
									onClick={() => setActiveSection && setActiveSection(rec.link)}
									style={{
										background: "#7fffd4",
										color: "#0f172a",
										border: "none",
										borderRadius: 8,
										padding: "8px 16px",
										fontSize: 13,
										fontWeight: 700,
										cursor: "pointer",
										whiteSpace: "nowrap",
									}}
								>
									{rec.action}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Key Metrics Grid */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
					gap: 20,
					marginBottom: 32,
				}}
			>
				<StatCard 
					label="Total Revenue" 
					value={stats.revenue || (stats.revenue === "$0" ? "$0" : "—")} 
					icon="💰"
					tooltip="Total sales revenue for the selected period"
					subtitle={(!stats.revenue || stats.revenue === "$0" || stats.revenue === "—") ? "No revenue data available" : null}
				/>
				<StatCard 
					label="Orders" 
					value={stats.orders !== null && stats.orders !== undefined ? stats.orders : "—"} 
					icon="📦"
					tooltip="Number of orders placed"
					subtitle={(stats.orders === 0 || stats.orders === null) ? "No orders yet" : null}
				/>
				<StatCard 
					label="Average Order Value" 
					value={stats.aov || "—"} 
					icon="💵"
					tooltip="Average revenue per order (Revenue ÷ Orders)"
				/>
				<StatCard 
					label="Conversion Rate" 
					value={stats.conversion || "—"} 
					icon="📈"
					tooltip="Percentage of visitors who made a purchase"
				/>
				<StatCard 
					label="Visitors" 
					value={stats.visitors || "—"} 
					icon="👥"
					tooltip="Total store visitors for the selected period"
					upgradeRequired={stats.visitorsUpgradeRequired}
					subtitle={
						stats.visitorsUpgradeRequired 
							? "Traffic analytics requires Shopify Advanced or Plus" 
							: (stats.visitors && stats.visitors.toString().includes('*')) 
								? "* Estimated from customer data" 
								: null
					}
				/>
				<StatCard 
					label="Products" 
					value={stats.products !== null ? stats.products : "—"} 
					icon="🛍️"
					tooltip="Total number of products in your catalog"
				/>
				<StatCard 
					label="SEO Issues" 
					value={stats.seoIssues !== null ? stats.seoIssues : "—"} 
					icon="🔍"
					tooltip="Number of SEO issues that need attention"
				/>
			</div>

			{/* SEO Crawl Results Panel */}
			{crawlResults && (
				<div style={{ background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)", border: "1px solid #2f3650", borderRadius: 16, padding: 24, marginBottom: 32 }}>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
						<div>
							<h3 style={{ color: "#e5e7eb", fontWeight: 700, fontSize: 18, margin: 0 }}>🔍 SEO Scan Results</h3>
							<p style={{ color: "#94a3b8", fontSize: 13, margin: "4px 0 0 0" }}>
								{crawlResults.pagesScanned} pages scanned • Last scan: {lastScanTime}
							</p>
						</div>
						<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
							<span style={{ background: "#2d1515", border: "1px solid #e53e3e", color: "#fc8181", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
								🔴 {crawlResults.high} High
							</span>
							<span style={{ background: "#2d2210", border: "1px solid #f59e0b", color: "#fbbf24", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
								🟡 {crawlResults.medium} Medium
							</span>
							<span style={{ background: "#1a2315", border: "1px solid #4ade80", color: "#86efac", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
								🟢 {crawlResults.low} Low
							</span>
							<button onClick={() => setCrawlResults(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
						</div>
					</div>
					{crawlResults.totalIssues === 0 ? (
						<div style={{ textAlign: "center", padding: "32px 0", color: "#7fffd4", fontSize: 16 }}>
							✅ No SEO issues found — your site looks great!
						</div>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
							{crawlResults.issues.map((issue, i) => (
								<div key={i}
									onClick={() => issue.fix && setActiveSection && setActiveSection(issue.fix)}
									style={{
										background: "#0f172a",
										border: `1px solid ${issue.severity === 'high' ? '#e53e3e' : issue.severity === 'medium' ? '#f59e0b' : '#4ade80'}`,
										borderRadius: 10,
										padding: "12px 16px",
										display: "flex",
										alignItems: "flex-start",
										gap: 12,
										cursor: issue.fix ? "pointer" : "default",
										transition: "all 0.15s",
									}}
									className="seo-issue-row"
								>
									<span style={{ fontSize: 16, marginTop: 1 }}>
										{issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢'}
									</span>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
											{issue.type}
											{issue.fix && (
												<span style={{ fontSize: 11, color: "#7fffd4", background: "rgba(127,255,212,0.1)", border: "1px solid rgba(127,255,212,0.3)", borderRadius: 4, padding: "1px 7px", fontWeight: 500 }}>
													Click to fix →
												</span>
											)}
										</div>
										<div style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>{issue.detail}</div>
										<div style={{ color: "#475569", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.page}</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Store Health Score */}
			{healthScore && (
				<div
					style={{
						background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
						border: `2px solid ${healthScore.grade === 'A' ? '#7fffd4' : healthScore.grade === 'B' ? '#4ade80' : healthScore.grade === 'C' ? '#fbbf24' : healthScore.grade === 'D' ? '#fb923c' : '#ef4444'}`,
						borderRadius: 16,
						padding: 24,
						marginBottom: 32,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 16,
					}}
				>
					<div style={{ flex: 1, minWidth: 200 }}>
						<h3 style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb", margin: "0 0 8px 0" }}>
							🏆 Store Health Score
						</h3>
						<p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
							Based on revenue, orders, and SEO performance
						</p>
					</div>
					<div style={{ textAlign: "center" }}>
						<div style={{ 
							fontSize: 56, 
							fontWeight: 900, 
							color: healthScore.grade === 'A' ? '#7fffd4' : healthScore.grade === 'B' ? '#4ade80' : healthScore.grade === 'C' ? '#fbbf24' : healthScore.grade === 'D' ? '#fb923c' : '#ef4444',
							lineHeight: 1,
						}}>
							{healthScore.grade}
						</div>
						<div style={{ fontSize: 14, color: "#94a3b8", marginTop: 8 }}>
							{healthScore.score}/100
						</div>
					</div>
				</div>
			)}

			{/* Goal Tracking */}
			<div
				style={{
					background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
					border: "1px solid #2f3650",
					borderRadius: 16,
					padding: 24,
					marginBottom: 32,
				}}
			>
				<h3 style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb", margin: "0 0 20px 0" }}>
					🎯 Monthly Goals
				</h3>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
					{/* Revenue Goal */}
					<div>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
							<span style={{ color: "#94a3b8", fontSize: 13 }}>Revenue Goal</span>
							<span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>
								{stats.revenueRaw ? `$${stats.revenueRaw.toFixed(0)}` : "$0"} / ${goals.revenue}
							</span>
						</div>
						<div style={{ background: "#2f3650", height: 8, borderRadius: 4, overflow: "hidden" }}>
							<div style={{ 
								background: "#7fffd4", 
								height: "100%", 
								width: `${Math.min((stats.revenueRaw / goals.revenue) * 100, 100)}%`,
								transition: "width 0.3s"
							}} />
						</div>
					</div>
					{/* Orders Goal */}
					<div>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
							<span style={{ color: "#94a3b8", fontSize: 13 }}>Orders Goal</span>
							<span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>
								{stats.orders || 0} / {goals.orders}
							</span>
						</div>
						<div style={{ background: "#2f3650", height: 8, borderRadius: 4, overflow: "hidden" }}>
							<div style={{ 
								background: "#4ade80", 
								height: "100%", 
								width: `${Math.min((stats.orders / goals.orders) * 100, 100)}%`,
								transition: "width 0.3s"
							}} />
						</div>
					</div>
					{/* Conversion Goal */}
					<div>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
							<span style={{ color: "#94a3b8", fontSize: 13 }}>Conversion Goal</span>
							<span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>
								{stats.conversion || "0%"} / {goals.conversion}%
							</span>
						</div>
						<div style={{ background: "#2f3650", height: 8, borderRadius: 4, overflow: "hidden" }}>
							<div style={{ 
								background: "#fbbf24", 
								height: "100%", 
								width: `${Math.min((parseFloat(stats.conversion || 0) / goals.conversion) * 100, 100)}%`,
								transition: "width 0.3s"
							}} />
						</div>
					</div>
				</div>
			</div>

			{/* Integration Health - Moved Higher */}
			<IntegrationHealthPanel />

			{/* Main Content Grid */}
			<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>
				{/* Left Column - Charts */}
				<div>
					<div
						style={{
							background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
							border: "1px solid #2f3650",
							borderRadius: 16,
							padding: 24,
						}}
					>
						<h3 style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb", margin: "0 0 20px 0" }}>
							📊 Performance Analytics
						</h3>
						<Suspense fallback={<Spinner />}>
							<DashboardCharts />
						</Suspense>
					</div>
				</div>

				{/* Right Column - Activity Feed + Top Products */}
				<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
					{/* Activity Feed */}
					<div
						style={{
							background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
							border: "1px solid #2f3650",
							borderRadius: 16,
							padding: 24,
						}}
					>
						<h3 style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb", margin: "0 0 20px 0" }}>⚡ Recent Activity</h3>
						<div>
							{recentActivity.length > 0 ? (
								recentActivity.map((activity, idx) => (
									<ActivityItem key={idx} {...activity} />
								))
							) : (
								<div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>
									<div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
									<div style={{ fontSize: 14 }}>No recent activity</div>
								</div>
							)}
						</div>
						<button
							style={{
								width: "100%",
								marginTop: 16,
								padding: "10px",
								background: "#2f3650",
								border: "1px solid #3a4565",
								borderRadius: 8,
								color: "#e5e7eb",
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
								transition: "all 0.2s",
							}}
						>
							View All Activity
						</button>
					</div>

					{/* Top Products Widget */}
					<div
						style={{
							background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
							border: "1px solid #2f3650",
							borderRadius: 16,
							padding: 24,
						}}
					>
						<h3 style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb", margin: "0 0 20px 0" }}>
							🏆 Top Products
						</h3>
						{topProducts.length > 0 ? (
							<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
								{topProducts.map((product, idx) => (
									<div
										key={product.id || idx}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											padding: 12,
											background: "#0f1324",
											border: "1px solid #2f3650",
											borderRadius: 8,
										}}
									>
										<div style={{ 
											fontSize: 20, 
											fontWeight: 900,
											color: idx === 0 ? "#fbbf24" : "#94a3b8",
											minWidth: 24,
										}}>
											#{idx + 1}
										</div>
										<div style={{ flex: 1 }}>
											<div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", marginBottom: 4 }}>
												{product.title || "Untitled Product"}
											</div>
											<div style={{ fontSize: 12, color: "#64748b" }}>
												{product.variants?.[0]?.price ? `$${product.variants[0].price}` : "No price"}
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>
								<div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
								<div style={{ fontSize: 14 }}>No products available</div>
							</div>
						)}
					</div>

					{/* Underperforming Products */}
					{underperformingProducts.length > 0 && (
						<div
							style={{
								background: "linear-gradient(135deg, #1a1d2e 0%, #232842 100%)",
								border: "1px solid #fb923c",
								borderRadius: 16,
								padding: 24,
							}}
						>
							<h3 style={{ fontSize: 18, fontWeight: 700, color: "#e5e7eb", margin: "0 0 20px 0" }}>
								⚠️ Needs Attention
							</h3>
							<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
								{underperformingProducts.map((product, idx) => (
									<div
										key={product.id || idx}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											padding: 12,
											background: "#0f1324",
											border: "1px solid #3a2d1a",
											borderRadius: 8,
										}}
									>
										<span style={{ fontSize: 20 }}>⚠️</span>
										<div style={{ flex: 1 }}>
											<div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", marginBottom: 4 }}>
												{product.title || "Untitled Product"}
											</div>
											<div style={{ fontSize: 12, color: "#fb923c" }}>
												{!product.images || product.images.length === 0 ? "Missing image" : 
												 !product.body_html ? "Missing description" : "Low price"}
											</div>
										</div>
										<button
											onClick={() => setActiveSection && setActiveSection("products")}
											style={{
												background: "transparent",
												border: "1px solid #fb923c",
												borderRadius: 6,
												padding: "6px 12px",
												color: "#fb923c",
												fontSize: 12,
												fontWeight: 600,
												cursor: "pointer",
											}}
										>
											Fix
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Quick Actions */}
			<div style={{ marginBottom: 32 }}>
				<h3 style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb", marginBottom: 20 }}>🚀 Quick Actions</h3>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
						gap: 16,
					}}
				>
					<QuickActionCard
						icon={scanningInProgress ? "⏳" : "🔍"}
						title={scanningInProgress ? "Scanning..." : "Run SEO Scan"}
						description={
							scanningInProgress && scanRemainingTime > 0
								? `Time remaining: ${Math.floor(scanRemainingTime / 60)}:${String(scanRemainingTime % 60).padStart(2, '0')} • Analyzing ${stats.products || '...'} products` 
								: scanningInProgress 
									? "Analyzing your site for SEO issues..." 
									: lastScanTime 
										? `Scan your store for SEO issues • Last: ${lastScanTime}` 
										: "Scan your entire store for SEO issues"
						}
						onClick={runSeoScan}
					/>
					<QuickActionCard
						icon="✍️"
						title="Generate Content"
						description="Create AI-powered product descriptions and blog posts"
						onClick={() => setActiveSection && setActiveSection("tools")}
					/>
					<QuickActionCard
						icon="🔧"
						title="Fix SEO Issues"
						description={`Fix ${stats.seoIssues || 0} SEO issues to improve rankings`}
						onClick={() => setActiveSection && setActiveSection("seo")}
					/>
					<QuickActionCard
						icon="📧"
						title="Email Campaign"
						description="Create and schedule automated email sequences"
						onClick={() => setActiveSection && setActiveSection("tools")}
					/>
					<QuickActionCard
						icon="📊"
						title="Analytics Report"
						description="View detailed insights and performance metrics"
						onClick={() => setActiveSection && setActiveSection("tools")}
					/>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
