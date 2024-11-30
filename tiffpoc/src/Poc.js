import React, { useState } from "react";
import { ClipLoader } from "react-spinners";
import "./styling/poc.css";

function Poc() {
  const [pageUrls, setPageUrls] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);

  const handleFileUpload = async (event) => {
    setLoading(true);

    const file = event.target.files[0];
    if (!file) return;

    // Extract file from the form
    const formData = new FormData();
    formData.append("file", file);

    // Send file to the flask app
    try {
      const response = await fetch("http://localhost:5010/convert-tiff", {
        method: "POST",
        body: formData,
      });

      // Response with page urls
      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert TIFF");
      }

      // store page urls
      setPageUrls(data.pages || []);
      setTotalPages(data.pages ? data.pages.length : 0);
      setPage(0);
      setError(null);
      setLoading(false);
      setImageSelected(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="mainWrapper">
      <div className="mainContent">
        <h1>TIFF Image Viewer</h1>

        <input
          disabled={imageSelected || loading}
          type="file"
          accept=".tif,.tiff"
          onChange={handleFileUpload}
        />
        <ClipLoader color="#3498db" loading={loading} size={15} />

        {/* Show Images or error message */}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {pageUrls.length > 0 ? (
          <img
            src={`http://localhost:5010${pageUrls[page]}`}
            alt={`Page ${page + 1}`}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        ) : (
          <p>
            {error ? "Failed to load image." : "Select a TIFF file to view."}
          </p>
        )}

        <div>
          <button onClick={() => setPage(page - 1)} disabled={page <= 0}>
            Previous Page
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next Page
          </button>
        </div>
        <p>
          Page {page + 1} of {totalPages}
        </p>
      </div>
    </div>
  );
}

export default Poc;
