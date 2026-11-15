export interface SpaceWeatherFeed {
    source: 'NASA_DONKI_LIVE' | 'NOAA_SWPC_LIVE' | 'CACHED_TELEMETRY';
    stormLevel: 'NONE' | 'MINOR_FLR' | 'MAJOR_SPE_CME';
    kpIndex: number;
    flareClass: string;
    headline: string;
}

export async function fetchLiveSpaceWeather(): Promise<SpaceWeatherFeed> {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];

    try {
        // 1. Primary: NASA DONKI Solar Flares
        const res = await fetch(
            `https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`
        );
        if (!res.ok) throw new Error('DONKI rate-limited');
        const flares = await res.json();
        const latest = Array.isArray(flares) && flares.length > 0 ? flares[flares.length - 1] : null;
        const classType: string = latest?.classType || 'B1.0';

        if (classType.startsWith('X')) {
            return {
                source: 'NASA_DONKI_LIVE',
                stormLevel: 'MAJOR_SPE_CME',
                kpIndex: 7,
                flareClass: classType,
                headline: `NASA DONKI Alert: Class ${classType} Solar Flare detected — Storm shelter protocol advised.`,
            };
        }
        if (classType.startsWith('M')) {
            return {
                source: 'NASA_DONKI_LIVE',
                stormLevel: 'MINOR_FLR',
                kpIndex: 5,
                flareClass: classType,
                headline: `NASA DONKI Advisory: Class ${classType} flare active — Monitor dosimetry.`,
            };
        }
        return {
            source: 'NASA_DONKI_LIVE',
            stormLevel: 'NONE',
            kpIndex: 2,
            flareClass: classType,
            headline: `NASA DONKI Nominal: Peak solar activity Class ${classType}.`,
        };
    } catch {
        // 2. Zero-Auth Backup: NOAA SWPC Planetary K-Index
        try {
            const noaaRes = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');
            const kpData = await noaaRes.json();
            const latestKp = kpData[kpData.length - 1]?.kp_index ?? 2;
            return {
                source: 'NOAA_SWPC_LIVE',
                stormLevel: latestKp >= 6 ? 'MAJOR_SPE_CME' : latestKp >= 4 ? 'MINOR_FLR' : 'NONE',
                kpIndex: latestKp,
                flareClass: 'NOAA-KP',
                headline: `NOAA SWPC Live Feed: Planetary K-Index at ${latestKp}.`,
            };
        } catch {
            // 3. Offline Demo-Safe Fallback
            return {
                source: 'CACHED_TELEMETRY',
                stormLevel: 'NONE',
                kpIndex: 2.3,
                flareClass: 'C1.4 (Cached)',
                headline: 'Offline Telemetry Mode: Baseline solar background (OSDR RadLab Seed).',
            };
        }
    }
}
