import React from 'react';

export const SystemDesign: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">IBOS Design Specification</h1>
        <p className="text-gray-500 mt-2">Informal Business Operating System</p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-brand-700 mb-3">1. Product Vision & Core Problem</h2>
        <div className="prose text-sm text-gray-700">
          <p className="mb-2"><strong className="text-gray-900">Core Problem:</strong> African informal SMEs face an "Invisibility Trap." Without digital records, they cannot access credit, insurance, or government support. Existing ERPs are too complex, expensive, and desktop-centric.</p>
          <p><strong className="text-gray-900">The Solution:</strong> IBOS acts as a "bridge" technology. It meets users where they are (informal, cash-based, mobile) and gently guides them up the "Maturity Ladder" towards formalization via progressive compliance and automated digitization.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-700 mb-3">2. User Personas</h2>
        <div className="space-y-3">
          {[
            { role: "Gogo Dlamini (Informal Trader)", desc: "Sells vegetables. Illiterate. Needs voice-first interface to track cash vs. credit sales." },
            { role: "Sipho (Micro-Manufacturer)", desc: "Welder in a township. Needs inventory tracking for steel and digital invoices for corporate clients." },
            { role: "Cooperative Leader", desc: "Manages a savings group (Stokvel). Needs transparency tools and bulk buying coordination." },
            { role: "Fintech Partner", desc: "Needs verified transaction data (alternative credit scoring) to offer micro-loans." },
            { role: "Municipal Officer", desc: "Needs aggregated, anonymized data for urban planning and zoning without punishing traders." }
          ].map((p, i) => (
            <div key={i} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
              <span className="font-bold text-gray-900 block">{p.role}</span>
              <span className="text-xs text-gray-600">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-700 mb-3">3. Architecture</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li><strong>Frontend:</strong> React/TypeScript (PWA), Offline-first (LocalForage/IndexedDB), Tailwind for styling.</li>
          <li><strong>AI Layer:</strong> Gemini API. <em>Flash-Lite</em> for UI speed, <em>Flash</em> for Search, <em>Pro</em> for reasoning/vision.</li>
          <li><strong>Data:</strong> Local-first sync architecture. E2E encryption for financial data.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-700 mb-3">5. AI System Design</h2>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p className="font-bold mb-2">Key Agents:</p>
          <ul className="space-y-2">
            <li>🤖 <strong>Bookkeeper Agent:</strong> Uses <code>gemini-3-pro-preview</code> (Vision) to extract data from messy handwritten receipts.</li>
            <li>🧠 <strong>Strategy Agent:</strong> Uses <code>gemini-3-pro-preview</code> (Thinking Budget 32k) to generate business plans from voice inputs.</li>
            <li>🌍 <strong>Market Agent:</strong> Uses <code>gemini-3-flash-preview</code> (Search Tool) to find real-time commodity prices.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-700 mb-3">7. Monetization</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-green-50 p-2 rounded border border-green-100">
            <strong>Freemium</strong><br/>Basic tools free for traders.
          </div>
          <div className="bg-blue-50 p-2 rounded border border-blue-100">
            <strong>Enterprise</strong><br/>Banks pay for credit-scoring API access.
          </div>
          <div className="bg-orange-50 p-2 rounded border border-orange-100">
            <strong>Gov/DFI</strong><br/>Subsidized licenses for digitization programs.
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-700 mb-3">10. Success Metrics</h2>
        <div className="text-sm text-gray-700">
          <p><strong>Economic:</strong> Value of loans disbursed via platform scores.</p>
          <p><strong>Social:</strong> Number of unregistered businesses obtaining Tax IDs.</p>
          <p><strong>Platform:</strong> Daily Active Users (DAU) & "Offline" reliability rate.</p>
        </div>
      </section>
    </div>
  );
};
