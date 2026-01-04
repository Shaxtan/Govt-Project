import React, { useState, useEffect, useCallback } from "react";

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
  iconUrl: "/iconss/open.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RedIcon = L.icon({
  iconUrl: "/iconss/closed.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function GeneralReport() {
  // Filter States
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [panchayat, setPanchayat] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);

  // --- Dynamic Dropdown States ---
  const [districts, setDistricts] = useState([]);
  const [blocksByDistrict, setBlocksByDistrict] = useState({});
  const [panchayatsByBlock, setPanchayatsByBlock] = useState({});

  // Get user info once for defaults
  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const mainAccId = user?.accountId || user?.accid || 1;

  // --- Dynamic Fetching Logic ---

  const fetchDistricts = useCallback(() => {
    ApiService.getAccountDropdown((res) => {
      if (res?.data?.resultCode === 1 && Array.isArray(res.data.data)) {
        setDistricts(res.data.data.filter((item) => item.type === "DIST"));
      }
    });
  }, []);

  const fetchChildAccounts = useCallback((parentId, parentType) => {
    ApiService.getChildAccountDropdown(parentId, (res) => {
      if (res?.data?.resultCode === 1 && Array.isArray(res.data.data)) {
        const children = res.data.data;
        if (parentType === "DIST") {
          setBlocksByDistrict((prev) => ({
            ...prev,
            [parentId]: children.filter((i) => i.type === "BLK"),
          }));
        } else if (parentType === "BLK") {
          setPanchayatsByBlock((prev) => ({
            ...prev,
            [parentId]: children.filter((i) => i.type === "PNCH"),
          }));
        }
      }
    });
  }, []);

  const fetchMapData = async () => {
    try {
      await ApiService.getMapViewData(
        {},
        (res) => {
          if (res?.data?.resultCode === 1) {
            setMapMarkers(res.data.data || []);
          } else {
            setMapMarkers([]);
          }
        },
        true,
        mainAccId
      );
    } catch (error) {
      console.error("Error fetching map data:", error);
      setMapMarkers([]);
    }
  };

  useEffect(() => {
    fetchDistricts();
    fetchMapData();
  }, [fetchDistricts, mainAccId]);

  // --- Search Logic ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      alert("Please select both dates.");
      return;
    }

    setLoading(true);
    try {
      // Logic: Use Panchayat ID if available, else Block, else District, else Login ID
      const targetId = panchayat || block || district || mainAccId;
      const startTime = `${fromDate} 00:00:00`;
      const endTime = `${toDate} 23:59:59`;

      const reportResponse = await ApiService.getGeneralReport(targetId, startTime, endTime);
      setReportData(reportResponse || []);
      await fetchMapData();
      setOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper lists based on selection
  const currentBlocks = district ? blocksByDistrict[district] || [] : [];
  const currentPanchayats = block ? panchayatsByBlock[block] || [] : [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <form onSubmit={handleSearch}>
                  <Grid container spacing={3}>
                    {/* DISTRICT */}
                    <Grid item xs={12} md={4}>
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT DISTRICT
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth className="gr-input-root">
                        <Select
                          value={district}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDistrict(val);
                            setBlock("");
                            setPanchayat("");
                            if (val) fetchChildAccounts(val, "DIST");
                          }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select District
                          </MenuItem>
                          {districts.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* BLOCK */}
                    <Grid item xs={12} md={4}>
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT BLOCK
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth className="gr-input-root">
                        <Select
                          value={block}
                          disabled={!district}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBlock(val);
                            setPanchayat("");
                            if (val) fetchChildAccounts(val, "BLK");
                          }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Block
                          </MenuItem>
                          {currentBlocks.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* PANCHAYAT */}
                    <Grid item xs={12} md={4}>
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT PANCHAYAT
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth className="gr-input-root">
                        <Select
                          value={panchayat}
                          disabled={!block}
                          onChange={(e) => setPanchayat(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Panchayat
                          </MenuItem>
                          {currentPanchayats.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* DATES */}
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

                    {/* SEARCH BUTTON */}
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

          {/* Map Section */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Live Vehicle Status View
                </MDTypography>
                <div className="gr-map-wrapper">
                  <MapContainer center={[20.5937, 78.9629]} zoom={5} className="gr-map-container">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

      {/* Result Modal - Content logic remains exactly the same as your provided code */}
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
                              const s = row.description.duration;
                              const h = Math.floor(s / 3600);
                              const m = Math.floor((s % 3600) / 60);
                              return h === 0 ? `${m} min` : `${h} hr ${m} min`;
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
