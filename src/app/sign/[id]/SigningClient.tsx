'use client'
import { useState, useRef, useEffect } from 'react'

interface Agreement {
  id: string
  title: string
  status: string
  [key: string]: any
}

export default function SigningClient({ agreement, signerNumber, token }: {
  agreement: Agreement
  signerNumber: number | null
  token: string | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const signerName = signerNumber ? agreement[`signer_${signerNumber}_name`] : null
  const signerRole = signerNumber ? agreement[`signer_${signerNumber}_role`] : null
  const alreadySigned = signerNumber ? !!agreement[`signer_${signerNumber}_signature`] : false

  // Canvas drawing handlers
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1B2A4A'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSigned(true)
  }

  const stopDraw = () => setIsDrawing(false)

  const clearSig = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
  }

  const submitSignature = async () => {
    if (!canvasRef.current || !signerNumber || !token) return
    setSubmitting(true)
    setError('')
    try {
      const signatureData = canvasRef.current.toDataURL('image/png')
      const res = await fetch(`/api/sign/${agreement.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signerNumber, signature: signatureData })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Signature status for each signer
  const signerStatus = (n: number) => ({
    name: agreement[`signer_${n}_name`],
    role: agreement[`signer_${n}_role`],
    signed: !!agreement[`signer_${n}_signature`],
    signedAt: agreement[`signer_${n}_signed_at`],
    signature: agreement[`signer_${n}_signature`],
  })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER - matches PDF */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Pillar Logo */}
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="36" width="24" height="4" fill="#C9A84C"/>
              <rect x="16" y="12" width="8" height="24" fill="#C9A84C"/>
              <rect x="10" y="8" width="20" height="4" fill="#C9A84C"/>
              <polygon points="6,8 34,8 20,0" fill="#C9A84C"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold tracking-wide">
                <span className="font-bold">BELANGER</span>
                <span className="font-light ml-1">&amp; ASSOCIATES</span>
              </h1>
              <p className="text-[#C9A84C] text-xs tracking-widest">ATTORNEYS AT LAW</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400 hidden sm:block">
            <p>6300 White Horse Rd, Ste 126</p>
            <p>Greenville, SC 29611</p>
            <p>Phone: (864) 209-5282</p>
          </div>
        </div>
        <div className="h-[3px] bg-[#C9A84C]" />
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 sm:px-10 py-8">
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-1">
              SETTLEMENT AND PAYMENT AGREEMENT
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Effective Date: March 29, 2026 &nbsp;|&nbsp; State of South Carolina, County of Greenville
            </p>
            <div className="w-3/5 mx-auto h-[2px] bg-[#C9A84C] mb-6" />

            {/* Parties Box */}
            <div className="bg-gray-50 border border-[#D4B55E] rounded-md px-5 py-4 mb-8">
              <p className="text-sm text-gray-800 mb-2">
                <span className="font-bold">CLIENTS:</span> Richard Robertson and Linda Alton, represented by Michael Pierce, Esq. of Belanger &amp; Associates
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-bold">RESPONDENT:</span> Mitchell Carolan
              </p>
            </div>

            {/* SECTION 1 */}
            <SectionHeader num="1" title="RECITALS" />
            <P>WHEREAS, there exists a dispute between the Clients and the Respondent regarding certain matters referenced in prior correspondence and a Non-Disclosure Agreement dated March 1, 2026;</P>
            <P>WHEREAS, the Parties desire to fully and finally resolve all claims, disputes, and matters arising from or related to the aforementioned incident;</P>
            <P>WHEREAS, the Respondent has agreed to pay the total settlement amount of Three Thousand Five Hundred Dollars ($3,500.00) to the Clients as full and final resolution;</P>
            <P>NOW, THEREFORE, in consideration of the mutual promises, covenants, and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:</P>

            {/* SECTION 2 */}
            <SectionHeader num="2" title="PAYMENT TERMS" />
            <P>The Respondent agrees to pay a total settlement amount of <strong>Three Thousand Five Hundred Dollars ($3,500.00)</strong> to the Clients according to the following installment schedule:</P>

            {/* Payment Table */}
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-sm border border-[#D4B55E]">
                <thead>
                  <tr className="bg-[#1B2A4A] text-white">
                    <th className="px-4 py-3 text-left font-semibold">Installment</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3">First Payment</td>
                    <td className="px-4 py-3">$1,750.00</td>
                    <td className="px-4 py-3">Upon execution</td>
                    <td className="px-4 py-3">Due immediately upon signing</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3">Second Payment</td>
                    <td className="px-4 py-3">$1,750.00</td>
                    <td className="px-4 py-3">No later than April 19, 2026</td>
                    <td className="px-4 py-3">Early payment permitted and encouraged</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <P>All payments shall be made in a form mutually agreed upon by the Parties, including but not limited to certified check, money order, or electronic transfer. Written confirmation of each payment shall be retained by all Parties.</P>

            {/* SECTION 3 */}
            <SectionHeader num="3" title="RELEASE AND RESOLUTION" />
            <P>Upon receipt of full payment of the total settlement amount ($3,500.00), the Clients, through their counsel Michael Pierce, Esq. of Belanger &amp; Associates, agree to the following:</P>
            <PI><strong>(a)</strong> Submit a formal statement to the appropriate authorities withdrawing any and all claims against the Respondent related to this matter;</PI>
            <PI><strong>(b)</strong> Take all appropriate steps, to the extent permitted by applicable law, to seek sealing and, where eligible, expungement of any record associated with this matter;</PI>
            <PI><strong>(c)</strong> Fully and forever release, acquit, and discharge the Respondent from any and all claims, demands, actions, causes of action, suits, damages, losses, costs, expenses, and liabilities of every kind and nature whatsoever, whether known or unknown, suspected or unsuspected, which the Clients now have, have ever had, or may hereafter have against the Respondent arising out of or in any way connected with this matter.</PI>

            {/* SECTION 4 - FINALITY - Gold highlighted box */}
            <SectionHeader num="4" title="FINALITY AND NON-REVIVAL OF CLAIMS" />
            <div className="bg-[#FFF8E7] border-2 border-[#C9A84C] rounded-md px-5 py-4 my-4">
              <p className="text-sm text-gray-800 leading-relaxed text-justify">
                Upon full payment as outlined in Section 2, this matter shall be considered <strong>permanently and irrevocably resolved</strong>. The Clients hereby covenant and agree that under no circumstances — including but not limited to any change in circumstances, discovery of new information, or passage of time — shall any claims, disputes, demands, or legal actions related to this matter be revisited, reopened, reinstated, or pursued against the Respondent at any future date. This release and covenant not to sue is absolute, unconditional, and final. Any attempt to revive claims related to this matter after full payment shall be deemed a breach of this Agreement.
              </p>
            </div>

            {/* SECTION 5 */}
            <SectionHeader num="5" title="BREACH AND DEFAULT" />
            <P>In the event the Respondent fails to make any payment as scheduled under this Agreement, the Clients reserve the right to pursue all available legal remedies under South Carolina law, including but not limited to civil action for the full outstanding balance, applicable court costs, reasonable attorney&apos;s fees, and any additional damages permitted by law.</P>
            <P>The protections, releases, and covenants outlined in Sections 3 and 4 of this Agreement shall not take effect until full payment of the total settlement amount ($3,500.00) has been received and confirmed.</P>

            {/* SECTION 6 */}
            <SectionHeader num="6" title="CONFIDENTIALITY" />
            <P>This Agreement and all of its terms, conditions, and the underlying facts shall remain strictly confidential. No Party shall disclose the existence, terms, or substance of this Agreement to any third party without prior written consent of all Parties, except as may be required by law, court order, or as necessary to enforce the terms of this Agreement. This provision shall be read in conjunction with and shall supplement the Non-Disclosure Agreement dated March 1, 2026, previously executed by the Parties.</P>

            {/* SECTION 7 */}
            <SectionHeader num="7" title="VOLUNTARY EXECUTION AND ACKNOWLEDGMENT" />
            <P>Each Party represents and warrants that:</P>
            <PI><strong>(a)</strong> They have read this Agreement in its entirety and fully understand its terms, conditions, and legal consequences;</PI>
            <PI><strong>(b)</strong> They enter into this Agreement voluntarily, without duress, coercion, or undue influence of any kind;</PI>
            <PI><strong>(c)</strong> They have been represented by legal counsel of their own choosing, or have voluntarily declined to seek such counsel, prior to executing this Agreement;</PI>
            <PI><strong>(d)</strong> They are fully aware of and accept the legal and binding effect of this Agreement.</PI>

            {/* SECTION 8 */}
            <SectionHeader num="8" title="GOVERNING LAW AND JURISDICTION" />
            <P>This Agreement shall be governed by, construed, and enforced in accordance with the laws of the <strong>State of South Carolina</strong>, without regard to its conflict of laws provisions. Any disputes arising under or relating to this Agreement shall be submitted to the exclusive jurisdiction of the courts of competent jurisdiction in Greenville County, South Carolina. In accordance with Rule 43(k) of the South Carolina Rules of Civil Procedure, this Agreement has been reduced to writing and signed by all Parties and their counsel.</P>

            {/* SECTION 9 */}
            <SectionHeader num="9" title="MISCELLANEOUS PROVISIONS" />
            <P><strong>Entire Agreement.</strong> This Agreement constitutes the entire understanding between the Parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, commitments, offers, and agreements, whether written or oral.</P>
            <P><strong>Amendments.</strong> No modification, alteration, amendment, or waiver of any term of this Agreement shall be valid unless reduced to writing and signed by all Parties.</P>
            <P><strong>Severability.</strong> If any provision of this Agreement is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</P>
            <P><strong>Counterparts.</strong> This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument.</P>
            <P><strong>Waiver.</strong> No failure to exercise, and no delay in exercising, any right or remedy under this Agreement shall operate as a waiver thereof. No single or partial exercise of any right or remedy shall preclude further exercise of the same or any other right or remedy.</P>

            {/* SIGNATURES SECTION */}
            <div className="mt-10 pt-6 border-t-2 border-[#C9A84C]">
              <h3 className="text-xl font-bold text-[#1B2A4A] text-center mb-2">SIGNATURES</h3>
              <p className="text-sm text-gray-500 text-center italic mb-8">
                IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.
              </p>

              {/* Show all signer statuses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {[1,2,3,4].map(n => {
                  const s = signerStatus(n)
                  return (
                    <div key={n} className={`border rounded-lg p-4 ${s.signed ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm text-[#1B2A4A]">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.role}</p>
                        </div>
                        {s.signed ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Signed</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Pending</span>
                        )}
                      </div>
                      {s.signed && s.signature && (
                        <img src={s.signature} alt={`${s.name} signature`} className="h-12 mt-1" />
                      )}
                      {s.signed && s.signedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Date: {new Date(s.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* SIGNING PAD - only show for the correct signer */}
              {signerNumber && !alreadySigned && !submitted && (
                <div className="border-2 border-[#1B2A4A] rounded-lg p-6 bg-[#FAFBFD]">
                  <h4 className="text-lg font-bold text-[#1B2A4A] mb-1">
                    Sign as: {signerName}
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">{signerRole}</p>
                  
                  <p className="text-xs text-gray-400 mb-2">Draw your signature below:</p>
                  <div className="border border-gray-300 rounded-md bg-white mb-3">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      className="w-full cursor-crosshair touch-none"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={stopDraw}
                      onMouseLeave={stopDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={stopDraw}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={clearSig}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={submitSignature}
                      disabled={!hasSigned || submitting}
                      className="px-6 py-2 text-sm bg-[#1B2A4A] text-white rounded-md hover:bg-[#2a3f6a] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                      {submitting ? 'Submitting...' : 'Submit Signature'}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                  
                  <p className="text-xs text-gray-400 mt-4">
                    By signing above, you acknowledge that you have read, understood, and voluntarily agree to all terms and conditions set forth in this Agreement.
                  </p>
                </div>
              )}

              {/* Already signed message */}
              {signerNumber && alreadySigned && !submitted && (
                <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50 text-center">
                  <div className="text-3xl mb-2">✓</div>
                  <h4 className="text-lg font-bold text-green-800 mb-1">Signature Received</h4>
                  <p className="text-sm text-green-700">
                    {signerName}, your signature has already been recorded for this agreement.
                  </p>
                </div>
              )}

              {/* Success after signing */}
              {submitted && (
                <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50 text-center">
                  <div className="text-3xl mb-2">✓</div>
                  <h4 className="text-lg font-bold text-green-800 mb-1">Signature Submitted Successfully</h4>
                  <p className="text-sm text-green-700 mb-2">
                    Thank you, {signerName}. Your signature has been recorded.
                  </p>
                  <p className="text-xs text-green-600">
                    You will receive a copy of the fully executed agreement once all parties have signed.
                  </p>
                </div>
              )}

              {/* No token / view-only */}
              {!signerNumber && (
                <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
                  <p className="text-sm text-gray-600">
                    This agreement is view-only. To sign, please use the personalized link provided to you.
                  </p>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center italic">
                This document is a legally binding agreement. All Parties are advised to retain a fully executed copy for their records.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - law firm branded */}
      <div className="bg-[#1B2A4A] mt-8">
        <div className="h-[2px] bg-[#C9A84C]" />
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Belanger &amp; Associates &nbsp;|&nbsp; Attorneys at Law &nbsp;|&nbsp; Greenville, South Carolina
          </p>
          <p className="text-xs text-gray-500">
            Secure Document Signing
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper components matching PDF styling
function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="mt-6 mb-3 border-b-2 border-[#C9A84C] pb-1">
      <h3 className="text-sm font-bold text-[#1B2A4A] tracking-wide">
        SECTION {num} &mdash; {title}
      </h3>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-800 leading-relaxed text-justify mb-3">
      {children}
    </p>
  )
}

function PI({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-800 leading-relaxed text-justify mb-2 pl-5">
      {children}
    </p>
  )
}
