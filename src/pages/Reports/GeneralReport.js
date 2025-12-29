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
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Services
import ApiService from "../../services/ApiService";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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

  // Mock Data for Dropdowns (Keep existing structure)
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
      // 1. Get accId from local storage (ApiService default logic)
      const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const accId = user?.accid || 1;

      // 2. Format dates for the API payload
      const startTime = `${fromDate} 00:00:00`;
      const endTime = `${toDate} 23:59:59`;

      // 3. Call the API
      const response = await ApiService.getGeneralReport(accId, startTime, endTime);

      setReportData(response); // response is res?.data?.data from ApiService
      setOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyleSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px" } };

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
                      <FormControl variant="outlined" fullWidth sx={inputStyleSx}>
                        <InputLabel>Select Area</InputLabel>
                        <Select
                          value={area}
                          label="Select Area"
                          onChange={(e) => setArea(e.target.value)}
                          sx={{ height: 45 }}
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
                      <FormControl variant="outlined" fullWidth sx={inputStyleSx}>
                        <InputLabel>Select Panchayat</InputLabel>
                        <Select
                          value={panchayat}
                          label="Select Panchayat"
                          onChange={(e) => setPanchayat(e.target.value)}
                          sx={{ height: 45 }}
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
                      <FormControl variant="outlined" fullWidth sx={inputStyleSx}>
                        <InputLabel>Select Ward</InputLabel>
                        <Select
                          value={ward}
                          label="Select Ward"
                          onChange={(e) => setWard(e.target.value)}
                          sx={{ height: 45 }}
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
                        sx={inputStyleSx}
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
                        sx={inputStyleSx}
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
                <MDBox
                  style={{
                    height: "450px",
                    width: "100%",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 0,
                  }}
                >
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: "100%", width: "100%" }}
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
                            position={[row.startTime.latitude, row.startTime.longitude]}
                          >
                            <Popup>
                              <strong>{row.meta?.name}</strong>
                              <br />
                              Qty: {row.description?.qty}
                              <br />
                              Start: {new Date(row.startTime.date).toLocaleString()}
                            </Popup>
                          </Marker>
                        )
                    )}
                  </MapContainer>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Result Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <MDBox
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 1000,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <MDTypography variant="h6" mb={2}>
            General Report Details
          </MDTypography>
          <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>District</TableCell>
                  <TableCell>Panchayat</TableCell>
                  <TableCell>Ward</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.meta?.district || "N/A"}</TableCell>
                    <TableCell>{row.meta?.panchayat || "N/A"}</TableCell>
                    <TableCell>{row.meta?.ward || "N/A"}</TableCell>
                    <TableCell>{row.meta?.name || "N/A"}</TableCell>
                    <TableCell>{new Date(row.startTime?.date).toLocaleString()}</TableCell>
                    <TableCell>{new Date(row.endtime?.date).toLocaleString()}</TableCell>
                    <TableCell>{row.description?.qty}</TableCell>
                    <TableCell>{row.description?.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <MDBox mt={3} display="flex" justifyContent="flex-end">
            <MDButton onClick={() => setOpen(false)} variant="gradient" color="error">
              Close
            </MDButton>
          </MDBox>
        </MDBox>
      </Modal>
    </DashboardLayout>
  );
}

export default GeneralReport;
