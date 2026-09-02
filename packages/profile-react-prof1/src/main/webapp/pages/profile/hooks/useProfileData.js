/**
 * Live-only Profile data hook. Always runs Splunk REST searches.
 */

import { useEffect, useState } from 'react';
import { runProfileSearch } from '../data/profileSearchClient.js';
import {
    getDemoMetricFeed,
    getDemoProfileFeed,
    isProfileDemoMode,
} from '../data/profileDemoFeeds.js';
import {
    emptyProfileFeed,
    mapRowsToMetricFeeds,
    mapRowsToProfileFeed,
} from '../profileContract.js';

/**
 * @param {'profile' | 'metric'} panel
 * @param {string} filterKey  Profile filter; ignored for metric unless product unifies later
 */
export function useProfileData(panel, filterKey = 'all') {
    const [state, setState] = useState({
        data: panel === 'metric' ? { cards: [] } : emptyProfileFeed(),
        loading: true,
        error: null,
        progress: 0,
        status: 'loading',
    });

    useEffect(() => {
        if (isProfileDemoMode()) {
            const timer = window.setTimeout(() => {
                setState({
                    data:
                        panel === 'metric'
                            ? getDemoMetricFeed()
                            : getDemoProfileFeed(filterKey),
                    loading: false,
                    error: null,
                    progress: 100,
                    status: 'demo',
                });
            }, 280);
            return () => window.clearTimeout(timer);
        }

        const controller = new AbortController();
        setState((s) => ({
            ...s,
            loading: true,
            error: null,
            progress: 0,
            status: 'loading',
        }));

        const onProgress = (p) => {
            setState((s) => ({
                ...s,
                progress: p.progress,
            }));
        };

        const run = async () => {
            if (panel === 'metric') {
                const rows = await runProfileSearch('profile_metrics', filterKey, {
                    signal: controller.signal,
                    onProgress,
                });
                return mapRowsToMetricFeeds(rows);
            }
            const [cardRows, vizRows] = await Promise.all([
                runProfileSearch('profile_cards', filterKey, {
                    signal: controller.signal,
                    onProgress,
                }),
                runProfileSearch('profile_viz', filterKey, {
                    signal: controller.signal,
                    onProgress,
                }),
            ]);
            return mapRowsToProfileFeed(cardRows, vizRows);
        };

        run()
            .then((data) => {
                setState({
                    data,
                    loading: false,
                    error: null,
                    progress: 100,
                    status: 'ok',
                });
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setState({
                    data:
                        panel === 'metric'
                            ? getDemoMetricFeed()
                            : getDemoProfileFeed(filterKey),
                    loading: false,
                    error: null,
                    progress: 100,
                    status: 'demo-fallback',
                    fallbackReason: String(err?.message || err),
                });
            });

        return () => controller.abort();
    }, [panel, filterKey]);

    return state;
}
