import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Belanger & Associates | Document Signing',
  description: 'Secure document signing portal — Belanger & Associates, Attorneys at Law',
  robots: 'noindex, nofollow',
}

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Override NexaVision root styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        body { 
          background: #f3f4f6 !important; 
          color: #1f2937 !important; 
        }
        body > div.fixed { display: none !important; }
      `}} />
      {children}
    </>
  )
}
