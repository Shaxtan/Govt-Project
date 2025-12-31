import React, { useState, useEffect } from "react";

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

// CSS
import "./GeneralReport.css";

// Services
import ApiService from "../../services/ApiService";

// --- Custom Icons ---
const GreenIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RedIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
  const [mapMarkers, setMapMarkers] = useState([]); // State for live vehicle markers

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

  // Reusable function to fetch map data
  const fetchMapData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const accId = user?.accid || 1;

      await ApiService.getMapViewData(
        {},
        (res) => {
          if (res?.data?.resultCode === 1) {
            setMapMarkers(res.data.data || []);
          } else {
            console.warn("Map data fetch failed or empty response:", res);
            setMapMarkers([]);
          }
        },
        true, // show loader if your ApiService supports it
        accId
      );
    } catch (error) {
      console.error("Error fetching map data:", error);
      setMapMarkers([]);
    }
  };

  // Load map markers when component mounts
  useEffect(() => {
    fetchMapData();
  }, []);

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

      // 1. Fetch General Report Table Data
      const reportResponse = await ApiService.getGeneralReport(accId, startTime, endTime);
      setReportData(reportResponse || []);

      // 2. Refresh map data after search (keeps live view updated)
      await fetchMapData();

      setOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
      setReportData([]);
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
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT AREA
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth className="gr-input-root">
                        <Select value={area} onChange={(e) => setArea(e.target.value)} displayEmpty>
                          <MenuItem value="" disabled>
                            Select Area
                          </MenuItem>
                          {areas.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT PANCHAYAT
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth className="gr-input-root">
                        <Select
                          value={panchayat}
                          onChange={(e) => setPanchayat(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Panchayat
                          </MenuItem>
                          {panchayats.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT WARD
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth className="gr-input-root">
                        <Select value={ward} onChange={(e) => setWard(e.target.value)} displayEmpty>
                          <MenuItem value="" disabled>
                            Select Ward
                          </MenuItem>
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
                  Live Vehicle Status View
                </MDTypography>
                <div className="gr-map-wrapper">
                  <MapContainer center={[20.5937, 78.9629]} zoom={5} className="gr-map-container">
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapMarkers.map((vehicle) => (
                      <Marker
                        key={vehicle.imei}
                        position={[vehicle.lat, vehicle.lng]}
                        icon={vehicle.ign === "Y" ? GreenIcon : RedIcon}
                      >
                        <Popup>
                          <strong>{vehicle.name || vehicle.vehnum || "Unknown Vehicle"}</strong>
                          <br />
                          <b>Ignition:</b> {vehicle.ign === "Y" ? "ON" : "OFF"}
                          <br />
                          <b>Address:</b> {vehicle.address || "N/A"}
                          <br />
                          <small>Last Update: {vehicle.cts || "N/A"}</small>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Result Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <MDBox className="gr-modal-box">
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <MDTypography variant="h6">General Report Details</MDTypography>
            <MDButton onClick={() => setOpen(false)} variant="gradient" color="error" size="small">
              Close
            </MDButton>
          </MDBox>

          <TableContainer component={Paper} className="gr-table-container">
            <Table stickyHeader className="gr-table">
              <TableHead>
                <TableRow>
                  <TableCell className="gr-th" sx={{ pr: 6 }}>
                    District
                  </TableCell>
                  <TableCell className="gr-th" sx={{ pr: 8 }}>
                    Block
                  </TableCell>
                  <TableCell className="gr-th" sx={{ pr: 14 }}>
                    Panchayat
                  </TableCell>
                  <TableCell className="gr-th" sx={{ pr: 9 }}>
                    Ward
                  </TableCell>
                  <TableCell className="gr-th" sx={{ pr: 6, whiteSpace: "nowrap" }}>
                    Start Time
                  </TableCell>
                  <TableCell className="gr-th" sx={{ pr: 2, whiteSpace: "nowrap" }}>
                    End Time
                  </TableCell>
                  <TableCell className="gr-th" sx={{ pr: 8 }}>
                    Qty(Litres)
                  </TableCell>
                  <TableCell className="gr-th">Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((row) => (
                    <TableRow key={row.id || Math.random()}>
                      <TableCell className="gr-td">{row.meta?.district || "N/A"}</TableCell>
                      <TableCell className="gr-td">{row.meta?.block || "N/A"}</TableCell>
                      <TableCell className="gr-td">{row.meta?.panchayat || "N/A"}</TableCell>
                      <TableCell className="gr-td">{row.meta?.name || "N/A"}</TableCell>
                      <TableCell className="gr-td">
                        {row.startTime?.date
                          ? new Date(row.startTime.date).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="gr-td">
                        {row.endtime?.date ? new Date(row.endtime.date).toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell className="gr-td">{row.description?.qty || "N/A"}</TableCell>
                      <TableCell className="gr-td">
                        {row.description?.duration
                          ? (() => {
                              const totalSeconds = row.description.duration;
                              const hours = Math.floor(totalSeconds / 3600);
                              const minutes = Math.floor((totalSeconds % 3600) / 60);
                              return hours === 0 ? `${minutes} min` : `${hours} hr ${minutes} min`;
                            })()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No data found for the selected date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </MDBox>
      </Modal>
    </DashboardLayout>
  );
}

export default GeneralReport;
