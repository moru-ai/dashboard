import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Moru - Runtime for AI Agents'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {/* Circle logo */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'white',
          }}
        />
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          Moru
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#888',
          }}
        >
          Runtime for AI Agents
        </div>
      </div>
    ),
    { ...size }
  )
}
