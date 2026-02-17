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
const StatCard = ({ label, value, change, icon, trend = "up", subtitle = null, upgradeRequired = false }) => (
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
				<div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
					{label}
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
	});
	const [loading, setLoading] = useState(true);
	const [copilotInput, setCopilotInput] = useState("");
	const [copilotReply, setCopilotReply] = useState("");
	const [copilotLoading, setCopilotLoading] = useState(false);
	const [shop, setShop] = useState(null);
	const [timePeriod, setTimePeriod] = useState(30); // 7, 30, or 90 days
	const [recentActivity, setRecentActivity] = useState([]);
	const [topProducts, setTopProducts] = useState([]);
	const [healthScore, setHealthScore] = useState(null);

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

				// Fetch top products
				try {
					const productsRes = await apiFetch("/api/product-seo/shopify-products?limit=5");
					if (productsRes && Array.isArray(productsRes)) {
						setTopProducts(productsRes.slice(0, 5));
					} else {
						setTopProducts([]);
					}
				} catch (prodErr) {
					console.warn("Failed to fetch top products:", prodErr);
					setTopProducts([]);
				}

			} catch (analyticsError) {
				console.warn("Failed to fetch Shopify analytics:", analyticsError);
				// Leave null if analytics fail
			}

			// Calculate health score
			calculateHealthScore(newStats);

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

	useEffect(() => {
		fetchStats();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [timePeriod]);

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
			`}</style>

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
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
					subtitle={(!stats.revenue || stats.revenue === "$0" || stats.revenue === "—") ? "No revenue data available" : null}
				/>
				<StatCard 
					label="Orders" 
					value={stats.orders !== null && stats.orders !== undefined ? stats.orders : "—"} 
					icon="📦"
					subtitle={(stats.orders === 0 || stats.orders === null) ? "No orders yet" : null}
				/>
				<StatCard label="Conversion Rate" value={stats.conversion || "—"} icon="📈" />
				<StatCard 
					label="Visitors" 
					value={stats.visitors || "—"} 
					icon="👥" 
					upgradeRequired={stats.visitorsUpgradeRequired}
					subtitle={
						stats.visitorsUpgradeRequired 
							? "Traffic analytics requires Shopify Advanced or Plus" 
							: (stats.visitors && stats.visitors.toString().includes('*')) 
								? "* Estimated from customer data" 
								: null
					}
				/>
				<StatCard label="Products" value={stats.products !== null ? stats.products : "—"} icon="🛍️" />
				<StatCard label="SEO Issues" value={stats.seoIssues !== null ? stats.seoIssues : "—"} icon="🔍" />
			</div>

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
					}}
				>
					<div>
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
						icon="✍️"
						title="Generate Content"
						description="Create AI-powered product descriptions and blog posts"
						onClick={() => setActiveSection && setActiveSection("tools")}
					/>
					<QuickActionCard
						icon="🔍"
						title="SEO Audit"
						description="Run comprehensive SEO analysis on your store"
						onClick={() => setActiveSection && setActiveSection("tools")}
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
