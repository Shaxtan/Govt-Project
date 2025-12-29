// GeneralReport.jsx
import React, { useState } from "react";

// Components
import DashboardLayout from "../../assets/components/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../assets/components/examples/Navbars/DashboardNavbar";
import MDBox from "../../assets/components/MDBox";
import MDTypography from "../../assets/components/MDTypography";
import MDButton from "../../assets/components/MDButton";

// Material UI
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Modal from "@mui/material/Modal";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

// Leaflet Map Components
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import tap from "../../assets/images/icons/flags/tap.png";

// CSS
import "./GeneralReport.css";

// Services
import ApiService from "../../services/ApiService";

// Custom tap icon for markers
const TapIcon = L.icon({
  iconUrl: tap,
  iconSize: [62, 62],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

function GeneralReport() {
  // Filter States
  const [area, setArea] = useState("");
  const [panchayat, setPanchayat] = useState("");
  const [ward, setWard] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Mock Data for Dropdowns
  const areas = [
    { id: 1, name: "North Region" },
    { id: 2, name: "South Region" },
  ];
  const panchayats = [
    { id: 1, name: "Panchayat A" },
    { id: 2, name: "Panchayat B" },
  ];
  const wards = [
    { id: 1, name: "Ward 01" },
    { id: 2, name: "Ward 02" },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      alert("Please select both dates.");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const accId = user?.accid || 1;

      const startTime = `${fromDate} 00:00:00`;
      const endTime = `${toDate} 23:59:59`;

      const response = await ApiService.getGeneralReport(accId, startTime, endTime);

      setReportData(response);
      setOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          {/* Top Filter Box */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <form onSubmit={handleSearch}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        className="gr-input-root"
                      >
                        <InputLabel>Select Area</InputLabel>
                        <Select
                          value={area}
                          label="Select Area"
                          onChange={(e) => setArea(e.target.value)}
                          className="gr-select"
                        >
                          {areas.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        className="gr-input-root"
                      >
                        <InputLabel>Select Panchayat</InputLabel>
                        <Select
                          value={panchayat}
                          label="Select Panchayat"
                          onChange={(e) => setPanchayat(e.target.value)}
                          className="gr-select"
                        >
                          {panchayats.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl
                        variant="outlined"
                        fullWidth
                        className="gr-input-root"
                      >
                        <InputLabel>Select Ward</InputLabel>
                        <Select
                          value={ward}
                          label="Select Ward"
                          onChange={(e) => setWard(e.target.value)}
                          className="gr-select"
                        >
                          {wards.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        label="From Date"
                        type="date"
                        fullWidth
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="gr-input-root"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        label="To Date"
                        type="date"
                        fullWidth
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="gr-input-root"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4} display="flex" alignItems="center">
                      <MDButton
                        type="submit"
                        variant="gradient"
                        color="info"
                        fullWidth
                        disabled={loading}
                      >
                        {loading ? "Searching..." : "Search"}
                      </MDButton>
                    </Grid>
                  </Grid>
                </form>
              </MDBox>
            </Card>
          </Grid>

          {/* Map Section Box */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Location View
                </MDTypography>
                <div className="gr-map-wrapper">
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    className="gr-map-container"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {reportData.map(
                      (row) =>
                        row.startTime?.latitude && (
                          <Marker
                            key={row.id}
                            position={[
                              row.startTime.latitude,
                              row.startTime.longitude,
                            ]}
                            icon={TapIcon}
                          >
                            <Popup>
                              <strong>{row.meta?.name}</strong>
                              <br />
                              Qty: {row.description?.qty}
                              <br />
                              Start:{" "}
                              {new Date(row.startTime.date).toLocaleString()}
                            </Popup>
                          </Marker>
                        )
                    )}
                  </MapContainer>
                </div>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Result Modal - FIXED TABLE ALIGNMENT */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <MDBox className="gr-modal-box">
          <MDTypography variant="h6" mb={2}>
            General Report Details
          </MDTypography>
          <TableContainer component={Paper} className="gr-table-container">
            <Table stickyHeader className="gr-table">
              <TableHead>
                <TableRow>
                  <TableCell className="gr-th gr-th-district">
                    District
                  </TableCell>
                  <TableCell className="gr-th gr-th-panchayat">
                    Panchayat
                  </TableCell>
                  <TableCell className="gr-th gr-th-ward">Ward</TableCell>
                  <TableCell className="gr-th gr-th-name">Name</TableCell>
                  <TableCell className="gr-th gr-th-start">Start Time</TableCell>
                  <TableCell className="gr-th gr-th-end">End Time</TableCell>
                  <TableCell className="gr-th gr-th-qty">Qty</TableCell>
                  <TableCell className="gr-th gr-th-duration">
                    Duration
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="gr-td gr-td-district">
                      {row.meta?.district || "N/A"}
                    </TableCell>
                    <TableCell className="gr-td gr-td-panchayat">
                      {row.meta?.panchayat || "N/A"}
                    </TableCell>
                    <TableCell className="gr-td gr-td-ward">
                      {row.meta?.ward || "N/A"}
                    </TableCell>
                    <TableCell className="gr-td gr-td-name">
                      {row.meta?.name || "N/A"}
                    </TableCell>
                    <TableCell className="gr-td gr-td-start">
                      {new Date(row.startTime?.date).toLocaleString()}
                    </TableCell>
                    <TableCell className="gr-td gr-td-end">
                      {new Date(row.endtime?.date).toLocaleString()}
                    </TableCell>
                    <TableCell className="gr-td gr-td-qty">
                      {row.description?.qty || "N/A"}
                    </TableCell>
                    <TableCell className="gr-td gr-td-duration">
                      {row.description?.duration || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <MDBox mt={3} display="flex" justifyContent="flex-end">
            <MDButton
              onClick={() => setOpen(false)}
              variant="gradient"
              color="error"
            >
              Close
            </MDButton>
          </MDBox>
        </MDBox>
      </Modal>
    </DashboardLayout>
  );
}

export default GeneralReport;
