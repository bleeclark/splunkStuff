export const totalRequestsFeed = {
    subheader: 'Total Requests',
    tooltipText: 'Total number of requests received by the server.',
    values: [10, 23, 15, 30, 25, 50],
    times: [
        '2024-06-01T00:00:00Z',
        '2024-06-01T01:00:00Z',
        '2024-06-01T02:00:00Z',
        '2024-06-01T03:00:00Z',
        '2024-06-01T04:00:00Z',
        '2024-06-01T05:00:00Z',
    ],
};

export const latencyRequests = {
    subheader: 'Latency',
    tooltipText: 'Latency of requests received by the server.',
    values: [80, 80, 70, 90, 90, 0],
    times: [
        '2024-06-01T00:00:00Z',
        '2024-06-01T01:00:00Z',
        '2024-06-01T02:00:00Z',
        '2024-06-01T03:00:00Z',
        '2024-06-01T04:00:00Z',
        '2024-06-01T05:00:00Z',
    ],
};

const demoTimes = [
    '2024-06-01T00:00:00Z',
    '2024-06-01T01:00:00Z',
    '2024-06-01T02:00:00Z',
    '2024-06-01T03:00:00Z',
    '2024-06-01T04:00:00Z',
    '2024-06-01T05:00:00Z',
];

export const tooltipsDemoFeed = {
    subheader: 'Tooltips demo',
    tooltipText: 'Widget-level tooltip (Splunk React UI Tooltip).',
    values: [12, 18, 14, 22, 20, 28],
    times: demoTimes,
};

export const annotationDemoFeed = {
    subheader: 'Annotation demo',
    tooltipText: 'Same sparkline stack; feed differs for section labeling.',
    values: [30, 28, 35, 32, 40, 38],
    times: demoTimes,
};

export const customTooltipsDemoFeed = {
    subheader: 'Custom tooltips demo',
    tooltipText: 'Hover the sparkline for per-point values (FixedSparkline).',
    values: [5, 15, 10, 25, 20, 45],
    times: ['a', 'b', 'c', 'd', 'e', 'f'],
};
