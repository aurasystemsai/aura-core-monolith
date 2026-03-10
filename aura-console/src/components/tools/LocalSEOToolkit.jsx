import React, { useState, useCallback, useRef } from "react";
import { ToolHeader, MozTabs, MozCard, MetricRow, ErrorBox, EmptyState, Spinner, SortableTable } from "../MozUI";

const TABS = ["Overview", "Citations", "Reviews", "Rankings"];

const S = {
  page: { background: '#09090b', minHeight: '100vh', padding: '24px', color: '#fafafa' },
  pre: { background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '16px', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '13px', color: '#e4e4e7' },
};

export default function LocalSEOToolkit() {
  const [tab, setTab] = useState(0);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gmb, setGmb] = useState(null);
  const [citations, setCitations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rankings, setRankings] = useState([]);

  const handleSync = useCallback(async () => {
    if (!location.trim()) return;
    setLoading(true);
    setError("");
    setGmb(null);
    try {
      const res = await fetch("/api/local-seo-toolkit/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Sync failed");
      if (data.gmb) setGmb(data.gmb);
      if (data.citations) setCitations(data.citations);
      if (data.reviews) setReviews(data.reviews);
      if (data.rankings) setRankings(data.rankings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location]);

  const citationCols = [{ key: 'name', label: 'Directory' }, { key: 'status', label: 'Status' }, { key: 'url', label: 'URL' }];
  const reviewCols = [{ key: 'author', label: 'Author' }, { key: 'rating', label: 'Rating' }, { key: 'text', label: 'Review', render: v => v ? v.slice(0, 80) + '…' : '—' }];
  const rankCols = [{ key: 'keyword', label: 'Keyword' }, { key: 'position', label: 'Position' }, { key: 'url', label: 'URL' }];

  return (
    <div style={S.page}>
      <ToolHeader
        title="Local SEO Toolkit"
        description="Sync Google My Business data, track citations, monitor reviews, and rank for local searches."
        inputValue={location}
        onInputChange={setLocation}
        onSubmit={handleSync}
        loading={loading}
        placeholder="Enter your business name or location..."
        buttonLabel="Sync GMB"
      />

      <MozTabs tabs={TABS} active={tab} onChange={setTab} style={{ marginBottom: '20px' }} />

      {loading && <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>}
      {error && <ErrorBox message={error} />}

      {!loading && tab === 0 && (
        <>
          {!gmb && !error && <EmptyState icon="📍" title="Enter your business or location above" message="We'll pull your GMB listing, citations, reviews and rankings." />}
          {gmb && (
            <>
              <MetricRow metrics={[
                { label: "Citations", value: citations.length, color: "#3b9eff" },
                { label: "Reviews", value: reviews.length, color: "#1fbb7a" },
                { label: "Keywords Tracked", value: rankings.length, color: "#f5c842" },
              ]} />
              <MozCard title="GMB Data">
                <pre style={S.pre}>{JSON.stringify(gmb, null, 2)}</pre>
              </MozCard>
            </>
          )}
        </>
      )}

      {!loading && tab === 1 && (
        citations.length === 0
          ? <EmptyState icon="📋" title="No citations yet" message="Sync a location to see citation data." />
          : <SortableTable columns={citationCols} rows={citations} />
      )}

      {!loading && tab === 2 && (
        reviews.length === 0
          ? <EmptyState icon="⭐" title="No reviews yet" message="Sync a location to see review data." />
          : <SortableTable columns={reviewCols} rows={reviews} />
      )}

      {!loading && tab === 3 && (
        rankings.length === 0
          ? <EmptyState icon="📊" title="No rankings yet" message="Sync a location to see local ranking data." />
          : <SortableTable columns={rankCols} rows={rankings} />
      )}
    </div>
  );
}
