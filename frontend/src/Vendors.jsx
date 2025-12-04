import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000"; // same as in App.jsx

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [loading, setLoading] = useState(false);

  const fetchVendors = async () => {
    const res = await axios.get(`${API_BASE}/api/vendors`);
    setVendors(res.data);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/vendors`, form);
      setForm({ name: "", email: "", phone: "", company: "" });
      await fetchVendors();
    } catch (e) {
      console.error(e);
      alert("Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Vendors</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="border p-2 rounded"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="border p-2 rounded"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        >
          {loading ? "Saving..." : "Add vendor"}
        </button>
      </form>

      <div className="space-y-2">
        {vendors.map((v) => (
          <div key={v._id} className="bg-white p-3 rounded shadow flex justify-between">
            <div>
              <div className="font-semibold">{v.name}</div>
              <div className="text-sm text-gray-600">{v.email}</div>
              {v.company && (
                <div className="text-sm text-gray-500">{v.company}</div>
              )}
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <p className="text-sm text-gray-600">No vendors yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
