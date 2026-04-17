import React from 'react';
import PreviewCard from './PreviewCard.jsx';
import {
    totalRequestsFeed,
    latencyRequests,
} from '@feeds/singleValueFeed.js';

export default function App() {
    return (
        <div
            style={{
                fontFamily:
                    'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                padding: 24,
                background: '#f4f4f4',
                minHeight: '100vh',
            }}
        >
            <h1 style={{ color: '#111', marginTop: 0 }}>
                Local preview (not the Splunk{' '}
                <code style={{ fontSize: '0.9em' }}>SingleValue</code> viz)
            </h1>
            <p style={{ color: '#333', maxWidth: 720 }}>
                This uses the same mock feeds and sparkline math as your
                splunk-one files. The real widget still runs only inside your
                Splunk app on the other machine.
            </p>

            <h2 style={{ color: '#111' }}>Total requests</h2>
            <div
                style={{
                    background: '#0B1F3B',
                    width: 376,
                    padding: 12,
                    marginBottom: 32,
                }}
            >
                <PreviewCard feed={totalRequestsFeed} />
            </div>

            <h2 style={{ color: '#111' }}>Latency (narrow spark range)</h2>
            <div
                style={{
                    background: '#0B1F3B',
                    width: 376,
                    padding: 12,
                    marginBottom: 32,
                }}
            >
                <PreviewCard
                    feed={latencyRequests}
                    sparkMin={20}
                    sparkMax={40}
                    sparkHeight={8}
                    sparkLeft={0}
                    sparkRight={0}
                    sparkPadLeft={0}
                    sparkPadRight={0}
                />
            </div>
        </div>
    );
}
