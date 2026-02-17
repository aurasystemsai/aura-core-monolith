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
const StatCard = ({ label, value, change, icon, trend = "up" }) => (
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
				<div style={{ fontSize: 36, fontWeight: 900, color: "#e5e7eb", marginTop: 8 }}>{value}</div>
				{change && (
					<div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
						<span style={{ color: trend === "up" ? "#22d37f" : "#ff4d4f", fontSize: 14, fontWeight: 700 }}>
							{trend === "up" ? "↑" : "↓"} {change}
						</span>
						<span style={{ fontSize: 12, color: "#64748b" }}>vs last period</span>
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
	});
	const [loading, setLoading] = useState(true);
	const [copilotInput, setCopilotInput] = useState("");
	const [copilotReply, setCopilotReply] = useState("");
	const [copilotLoading, setCopilotLoading] = useState(false);
	const [shop, setShop] = useState(null);
	const [recentActivity] = useState([
		{ icon: "📦", title: "Product SEO optimized", timestamp: "2 minutes ago", type: "SEO" },
		{ icon: "✉️", title: "Email campaign sent", timestamp: "1 hour ago", type: "Marketing" },
		{ icon: "🤖", title: "AI content generated", timestamp: "3 hours ago", type: "Content" },
		{ icon: "📊", title: "Analytics report ready", timestamp: "5 hours ago", type: "Analytics" },
		{ icon: "🎯", title: "A/B test completed", timestamp: "1 day ago", type: "Testing" },
	]);

	useEffect(() => {
		async function fetchStats() {
			setLoading(true);
			try {
				const projectId = localStorage.getItem("auraProjectId");
				let products = null,
					seoIssues = null;
				if (projectId) {
					const prodRes = await fetch(`${API_BASE}/projects/${projectId}/drafts`);
					if (prodRes.ok) {
						const prodData = await prodRes.json();
						products = Array.isArray(prodData) ? prodData.length : prodData.items ? prodData.items.length : null;
					}
					const fixRes = await fetch(`${API_BASE}/projects/${projectId}/fix-queue`);
					if (fixRes.ok) {
						const fixData = await fixRes.json();
						seoIssues = fixData.counts && fixData.counts.open ? fixData.counts.open : 0;
					}
				}
				// Mock additional stats for now - can be replaced with real API calls
				setStats({
					products,
					seoIssues,
					revenue: "$12,450",
					orders: 143,
					conversion: "3.2%",
					visitors: "4.5K",
				});
			} catch (e) {
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
		}
		fetchStats();
	}, []);

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

	if (loading) {
		return (
			<div>
				<Spinner />
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
				<div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
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
				<StatCard label="Total Revenue" value={stats.revenue} change="+12.5%" trend="up" icon="💰" />
				<StatCard label="Orders" value={stats.orders} change="+8.3%" trend="up" icon="📦" />
				<StatCard label="Conversion Rate" value={stats.conversion} change="+0.4%" trend="up" icon="📈" />
				<StatCard label="Visitors" value={stats.visitors} change="-2.1%" trend="down" icon="👥" />
				<StatCard label="Products" value={stats.products !== null ? stats.products : "—"} icon="🛍️" />
				<StatCard label="SEO Issues" value={stats.seoIssues !== null ? stats.seoIssues : "—"} icon="🔍" />
			</div>

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

				{/* Right Column - Activity Feed */}
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
						{recentActivity.map((activity, idx) => (
							<ActivityItem key={idx} {...activity} />
						))}
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

			{/* Integration Health */}
			<IntegrationHealthPanel />
		</div>
	);
};

export default Dashboard;
