import { ImageResponse } from 'next/og'

export const runtime = 'edge'
 
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'hsl(29, 100%, 54%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
        }}
      >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2a10 10 0 0 0-2 19.5v-1.5a8 8 0 1 1 4 0v1.5A10 10 0 0 0 12 2Z" />
            <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M12 13v1.5" />
            <path d="M10 14.5a4 4 0 0 0-1.5 2.5" />
            <path d="M15.5 17a4 4 0 0 0-2.5-1.5" />
            <path d="M12 21.5V19" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
