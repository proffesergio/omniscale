import { ImageResponse } from 'next/og';
export const alt = 'OmniScale — Creative minds. Commercial instincts.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#f9f8f4',
        width: '100%',
        height: '100%',
        padding: '75px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 32, color: '#ed603c' }}>↗ omniscale</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 76,
          lineHeight: 1.1,
          letterSpacing: -4,
          color: '#222421',
        }}
      >
        <span>Creative minds.</span>
        <span style={{ color: '#ed603c' }}>Commercial instincts.</span>
      </div>
      <div style={{ display: 'flex', fontSize: 20, color: '#68715b' }}>
        FUNNEL ECONOMICS / CREATIVE VELOCITY / GLOBAL GROWTH
      </div>
    </div>,
    size,
  );
}
