import { useEffect, useState } from "react";
import axios from "axios";
import Vendors from "./Vendors";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = "http://localhost:5002"; // backend port

function App() {
  const [text, setText] = useState("");
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("rfps"); // "rfps" | "vendors"

  //comparison
  const [comparison, setComparison] = useState(null);




  // NEW state for sending RFPs
  const [vendors, setVendors] = useState([]);
  const [sendRfp, setSendRfp] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [sending, setSending] = useState(false);

  // Removed custom toast state and effect as we're using react-hot-toast now


  const fetchRfps = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/rfps`);
      setRfps(res.data);
    } catch (e) {
      console.error(e);
      setError("Failed to load RFPs");
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/vendors`);
      setVendors(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRfps();
    fetchVendors();
  }, []);

  const handleCreateRfp = async () => {
    setError("");
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/rfps`, { text });
      setText("");
      setRfps((prev) => [res.data, ...prev]);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || "Failed to create RFP");
    } finally {
      setLoading(false);
    }
  };


  const handleCompare = async (rfp) => {
  try {
    const res = await axios.post(`${API_BASE}/api/rfps/${rfp._id}/compare`);
    setComparison({ rfp, ...res.data });
  } catch (e) {
    console.error(e);
    alert("Failed to compare proposals");
  }
};
  // NEW: open modal
  const handleOpenSendModal = (rfp) => {
    setSendRfp(rfp);
    setSelectedVendors([]);
  };

  // NEW: toggle vendor checkbox
  const handleToggleVendor = (id) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // NEW: call backend to send
  const handleSendRfp = async () => {
    if (!sendRfp || selectedVendors.length === 0) return;
    setSending(true);
    try {
      await axios.post(`${API_BASE}/api/rfps/${sendRfp._id}/send`, {
        vendorIds: selectedVendors,
      });
      toast.success("RFP sent to selected vendors!");
      setSendRfp(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to send RFP");

    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header + tabs */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI RFP Manager</h1>
            <p className="text-sm text-gray-600">
              Create RFPs from natural language and manage vendors.
            </p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setView("rfps")}
              className={`px-3 py-1 rounded ${
                view === "rfps" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              RFPs
            </button>
            <button
              onClick={() => setView("vendors")}
              className={`px-3 py-1 rounded ${
                view === "vendors" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              Vendors
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {view === "rfps" && (
          <>
            {/* Create RFP */}
            <section className="bg-white rounded-lg shadow p-4 space-y-3">
              <h2 className="text-lg font-semibold">
                Create RFP from natural language
              </h2>
              <textarea
                className="w-full border rounded-md p-3 min-h-[120px] text-sm"
                placeholder="Example: I need 20 laptops with 16GB RAM and 15 monitors 27 inch, budget 50000 USD, delivery in 30 days, payment terms net 30, 1 year warranty."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={handleCreateRfp}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create RFP"}
              </button>
              
            </section>

            {/* List RFPs */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">RFPs</h2>
              {rfps.length === 0 && (
                <p className="text-sm text-gray-600">
                  No RFPs yet. Create one above.
                </p>
              )}
              <div className="space-y-3">
                {rfps.map((rfp) => (
                  <div
                    key={rfp._id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-100"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {rfp.title || "Untitled RFP"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Budget: {rfp.budget} {rfp.currency} • Delivery:{" "}
                      {rfp.deliveryDays} days • Warranty:{" "}
                      {rfp.warrantyMonths} months
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {rfp.description}
                    </p>
                    <ul className="mt-3 text-sm text-gray-700 list-disc list-inside">
                      {rfp.items?.map((item, idx) => (
                        <li key={idx}>
                          {item.quantity} × {item.description}
                        </li>
                      ))}
                    </ul>

                    {/* NEW button */}
                    <button
                      onClick={() => handleOpenSendModal(rfp)}
                      className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Send to vendors
                    </button>
                    <button
                  onClick={() => handleCompare(rfp)}
                  className="mt-3 ml-2 px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Compare proposals
                </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {view === "vendors" && <Vendors />}
      </main>

      {/* Send RFP modal */}
      {sendRfp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              Send “{sendRfp.title}” to vendors
            </h3>
             {/* Select all row */}
  <label className="flex items-center gap-2 text-sm font-semibold">
    <input
      type="checkbox"
      checked={selectedVendors.length === vendors.length && vendors.length > 0}
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedVendors(vendors.map((v) => v._id));
        } else {
          setSelectedVendors([]);
        }
      }}
    />
    <span>Select all vendors</span>
  </label>
            <div className="max-h-60 overflow-y-auto mb-3 space-y-1">
              {vendors.map((v) => (
                <label key={v._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(v._id)}
                    onChange={() => handleToggleVendor(v._id)}
                  />
                  <span>
                    {v.name} ({v.email})
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSendRfp(null)}
                className="px-3 py-1 text-sm bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRfp}
                disabled={sending || selectedVendors.length === 0}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 3000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      {comparison && comparison.result && comparison.result.scores && (
  <div className="max-w-5xl mx-auto px-4 pb-6 mt-6">
    <h2 className="text-lg font-semibold mb-2">
      Comparison for {comparison.rfp.title}
    </h2>

    <table className="w-full text-sm border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-2 py-1 text-left">Vendor</th>
          <th className="border px-2 py-1 text-left">Total</th>
          <th className="border px-2 py-1 text-left">Delivery (days)</th>
          <th className="border px-2 py-1 text-left">Warranty (months)</th>
          <th className="border px-2 py-1 text-left">Score</th>
        </tr>
      </thead>
      <tbody>
        {comparison.result.scores.map((s) => {
          const p = comparison.proposals.find(
            (pp) => pp.vendorName === s.vendorName
          );
          return (
            <tr key={s.vendorName}>
              <td className="border px-2 py-1">{s.vendorName}</td>
              <td className="border px-2 py-1">
                {p?.proposal.total} {p?.proposal.currency}
              </td>
              <td className="border px-2 py-1">
                {p?.proposal.deliveryDays}
              </td>
              <td className="border px-2 py-1">
                {p?.proposal.warrantyMonths}
              </td>
              <td className="border px-2 py-1">
                {s.totalScore}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <p className="mt-3 text-sm">
      <strong>AI recommendation:</strong>{" "}
      {comparison.result.recommendation.vendorName} –{" "}
      {comparison.result.recommendation.reason}
    </p>
  </div>
)}

    </div>
  );
}

export default App;
