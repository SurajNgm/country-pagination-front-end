import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx"; // Import XLSX library
import "./Country.css";

const State = () => {
    const [states, setStates] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [newState, setNewState] = useState({
        name: "",
        countryId: "", // use countryId for dropdown selection
    });
    const [editingState, setEditingState] = useState(null);
    const [viewingState, setViewingState] = useState(null);
    const closeViewModal = () => setViewingState(null);
    const pageSize = 5;

    useEffect(() => {
        fetchStates(currentPage);
        fetchCountries();
    }, [currentPage]);

    // Fetch states with pagination
    const fetchStates = async (page) => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8080/state?pageNo=${page}&pageSize=${pageSize}`
            );
            const result = await response.json();
            setStates(result.content || []);
            setTotalPages(result.totalPages || 0);
        } catch (error) {
            console.error("Error fetching states:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all countries for dropdown
    const fetchCountries = async () => {
        try {
            const response = await fetch("http://localhost:8080/country");
            const result = await response.json();
            if (Array.isArray(result)) {
                setCountries(result);
            } else {
                console.error("Unexpected API response format:", result);
                setCountries([]); // Default to an empty array if the response format is incorrect
            }
        } catch (error) {
            console.error("Error fetching countries:", error);
            setCountries([]); // Default to an empty array in case of an error
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Add a new state
    const addState = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8080/state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newState),
            });
            if (response.ok) {
                fetchStates(currentPage);
                setNewState({ name: "", countryId: "" });
            } else {
                console.error("Failed to add state.");
            }
        } catch (error) {
            console.error("Error adding state:", error);
        }
    };

    
    const startEditing = (state) => {
        setEditingState(state);
        setNewState({ name: state.name, countryId: state.countryId });
    };

    
    const updateState = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8080/state/${editingState.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newState),
            });
            if (response.ok) {
                fetchStates(currentPage);
                setEditingState(null);
                setNewState({ name: "", countryId: "" });
            } else {
                console.error("Failed to update state.");
            }
        } catch (error) {
            console.error("Error updating state:", error);
        }
    };

    const deleteState = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/state/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchStates(currentPage);
            } else {
                console.error("Failed to delete state.");
            }
        } catch (error) {
            console.error("Error deleting state:", error);
        }
    };

    // Generate PDF from the state list
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text("State List", 14, 16);
        
        const tableColumn = ["ID", "State Name", "Country"];
        const tableRows = states.map(state => [
            state.id,
            state.name,
            state.country ? state.country.name : "N/A",
        ]);
        
        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save("state_list.pdf");
    };

    const exportToExcel = () => {
        const data = states.map((state) => ({
            ID: state.id,
            Name: state.name,
            Country: state.country ? state.country.name : "N/A",
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "States");
        XLSX.writeFile(workbook, "States.xlsx");
    };

    return (
        <>
            <div className="container">
                <h3>State Management</h3>

                {/* Add/Update State Form */}
                <form onSubmit={editingState ? updateState : addState}>
                    <div className="form-group">
                        <label htmlFor="name">State Name:</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter the State Name"
                            value={newState.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country">Country:</label>
                        <select
                            name="countryId"
                            id="country"
                            value={newState.countryId || ""}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select a Country</option>
                            {countries && countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit">{editingState ? "Update State" : "Add State"}</button>
                    {editingState && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingState(null);
                                setNewState({ name: "", countryId: "" });
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            {/* State Table */}
            <div className="tableData">
                <h3>State Lists</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : states.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Country</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {states.map((state) => (
                                <tr key={state.id}>
                                    <td>{state.id}</td>
                                    <td>{state.name}</td>
                                    <td>{state.country}</td>
                                    <td>
                                        <button onClick={() => startEditing(state)}>Edit</button>
                                        <button onClick={() => deleteState(state.id)}>Delete</button>
                                        <button onClick={() => setViewingState(state)}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No data available</p>
                )}

                {/* PDF Button */}
                <button onClick={generatePDF}>Download PDF</button>
                {/* Export to Excel Button */}
                <button onClick={exportToExcel}>Export to Excel</button>

                {viewingState && (
                    <div className="modal">
                        <div className="modal-content">
                            <h4>State Details</h4>
                            <p><strong>ID:</strong> {viewingState.id}</p>
                            <p><strong>Name:</strong> {viewingState.name}</p>
                            <p>
                                <strong>Country:</strong> {viewingState.country ? viewingState.country.name : "N/A"}
                            </p>
                            <button onClick={closeViewModal}>Close</button>
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="datapage">
                    <button onClick={handlePrevious} disabled={currentPage === 0}>
                        Previous
                    </button>
                    <span>
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button onClick={handleNext} disabled={currentPage === totalPages - 1}>
                        Next
                    </button>
                </div>
            </div>
        </>
    );
};

export default State;
