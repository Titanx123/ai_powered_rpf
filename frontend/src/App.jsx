import { useEffect, useState } from "react";
import axios from "axios";
import Vendors from "./Vendors";


const API_BASE = "http://localhost:4000"; // change if your backend port is different

function App() {
  const [text, setText] = useState("");
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("rfps"); // "rfps" | "vendors"

  const fetchRfps = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/rfps`);
      setRfps(res.data);
    } catch (e) {
      console.error(e);
      setError("Failed to load RFPs");
    }
  };

  useEffect(() => {
    fetchRfps();
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
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {view === "vendors" && <Vendors />}
      </main>
    </div>
  );
}

export default App;
