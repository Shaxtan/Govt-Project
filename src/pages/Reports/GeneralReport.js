import React, { useState, useEffect, useCallback, useMemo } from "react";

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

  // --- Hierarchical Dropdown States ---
  const [userRole, setUserRole] = useState("");
  const [dropdownData, setDropdownData] = useState({ districts: [] });
  const [blocksByDistrict, setBlocksByDistrict] = useState({});
  const [panchayatsByBlock, setPanchayatsByBlock] = useState({});

  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const mainAccId = user?.accountId || user?.accid || 1;

  // --- Hierarchical Fetching Logic ---
  const fetchChildren = useCallback((id, targetType) => {
    ApiService.getHierarchicalDropdown(id, targetType, (res) => {
      if (res?.data?.resultCode === 1 && Array.isArray(res.data.data)) {
        const data = res.data.data;
        if (targetType === "DIST") {
          setDropdownData((prev) => ({ ...prev, districts: data }));
        } else if (targetType === "BLK") {
          setBlocksByDistrict((prev) => ({ ...prev, [id]: data }));
        } else if (targetType === "PNCH") {
          setPanchayatsByBlock((prev) => ({ ...prev, [id]: data }));
        }
      }
    });
  }, []);

  // Initialization: Get user details and set up initial dropdowns
  useEffect(() => {
    ApiService.getMe((res) => {
      if (res?.data?.resultCode === 1 && res?.data?.data) {
        const userData = res.data.data;
        setUserRole(userData.type);

        // Cascade logic based on logged in user type
        if (userData.type === "ST") {
          fetchChildren(userData.id, "DIST");
        } else if (userData.type === "DIST") {
          setDistrict(userData.id);
          fetchChildren(userData.id, "BLK");
        } else if (userData.type === "BLK") {
          setBlock(userData.id);
          fetchChildren(userData.id, "PNCH");
        }
      }
    });
  }, [fetchChildren]);

  // Fetch Map Data Helper
  const fetchMapData = async (targetId) => {
    try {
      await ApiService.getMapViewData(
        {},
        (res) => {
          setMapMarkers(res?.data?.data || []);
        },
        true,
        targetId
      );
    } catch (error) {
      console.error("Error fetching map data:", error);
      setMapMarkers([]);
    }
  };

  useEffect(() => {
    fetchMapData(mainAccId);
  }, [mainAccId]);

  // --- Search Logic ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      alert("Please select both dates.");
      return;
    }

    setLoading(true);
    try {
      // ✅ LOGIC: Latest selected dropdown ID takes priority
      const targetId = panchayat || block || district || mainAccId;

      const startTime = `${fromDate} 00:00:00`;
      const endTime = `${toDate} 23:59:59`;

      const reportResponse = await ApiService.getGeneralReport(targetId, startTime, endTime);
      setReportData(reportResponse || []);

      // Update map markers based on the selected region
      await fetchMapData(targetId);

      setOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper lists using useMemo for performance
  const currentBlocks = useMemo(
    () => (district ? blocksByDistrict[district] || [] : []),
    [district, blocksByDistrict]
  );
  const currentPanchayats = useMemo(
    () => (block ? panchayatsByBlock[block] || [] : []),
    [block, panchayatsByBlock]
  );

  // Role-based visibility
  const shouldShowDistrict = userRole === "ST" || !userRole;
  const shouldShowBlock = userRole === "ST" || userRole === "DIST" || !userRole;

  const columns = {
    district: { width: 120 },
    block: { width: 120 },
    panchayat: { width: 150 },
    ward: { width: 140 },
    startTime: { width: 180 },
    endTime: { width: 180 },
    qty: { width: 100, textAlign: "right" },
    duration: { width: 120 },
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <form onSubmit={handleSearch}>
                  <Grid container spacing={2} alignItems="flex-end">
                    {/* DISTRICT */}
                    {shouldShowDistrict && (
                      <Grid item xs={12} md={2.4}>
                        <MDBox mb={1} ml={0.5}>
                          <MDTypography variant="caption" fontWeight="bold">
                            SELECT DISTRICT
                          </MDTypography>
                        </MDBox>
                        <FormControl variant="outlined" fullWidth size="small">
                          <Select
                            value={district}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDistrict(val);
                              setBlock("");
                              setPanchayat("");
                              if (val) fetchChildren(val, "BLK");
                            }}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>
                              Select District
                            </MenuItem>
                            {dropdownData.districts.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* BLOCK */}
                    {shouldShowBlock && (
                      <Grid item xs={12} md={2.4}>
                        <MDBox mb={1} ml={0.5}>
                          <MDTypography variant="caption" fontWeight="bold">
                            SELECT BLOCK
                          </MDTypography>
                        </MDBox>
                        <FormControl variant="outlined" fullWidth size="small">
                          <Select
                            value={block}
                            disabled={!district && shouldShowDistrict}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBlock(val);
                              setPanchayat("");
                              if (val) fetchChildren(val, "PNCH");
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
                    )}

                    {/* PANCHAYAT */}
                    <Grid item xs={12} md={2.4}>
                      <MDBox mb={1} ml={0.5}>
                        <MDTypography variant="caption" fontWeight="bold">
                          SELECT PANCHAYAT
                        </MDTypography>
                      </MDBox>
                      <FormControl variant="outlined" fullWidth size="small">
                        <Select
                          value={panchayat}
                          disabled={!block && shouldShowBlock}
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
                    <Grid item xs={12} md={1.6}>
                      <TextField
                        label="From Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1.6}>
                      <TextField
                        label="To Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    {/* SEARCH BUTTON */}
                    <Grid item xs={12} md={1.6}>
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
            <Table stickyHeader className="gr-table" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell className="gr-th" sx={columns.district}>
                    District
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.block}>
                    Block
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.panchayat}>
                    Panchayat
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.ward}>
                    Ward
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.startTime}>
                    Start Time
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.endTime}>
                    End Time
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.qty}>
                    Qty (Litres)
                  </TableCell>
                  <TableCell className="gr-th" sx={columns.duration}>
                    Duration
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((row, index) => (
                    <TableRow key={row.id || index}>
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
                      <TableCell className="gr-td" sx={{ textAlign: "right" }}>
                        {row.description?.qty || "N/A"}
                      </TableCell>
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
