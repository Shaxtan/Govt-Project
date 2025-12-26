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

// Leaflet Map Components
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// Fix for default marker icons in Leaflet + React
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function GeneralReport() {
  // State for Dropdowns
  const [area, setArea] = useState("");
  const [panchayat, setPanchayat] = useState("");
  const [ward, setWard] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock Data (Replace with your ApiService calls)
  const areas = [{ id: 1, name: "North Region" }, { id: 2, name: "South Region" }];
  const panchayats = [{ id: 1, name: "Panchayat A" }, { id: 2, name: "Panchayat B" }];
  const wards = [{ id: 1, name: "Ward 01" }, { id: 2, name: "Ward 02" }];

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Searching for:", { area, panchayat, ward, fromDate, toDate });
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  };

  const inputStyleSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px" } };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* <MDTypography variant="h4" fontWeight="medium" mb={3}>
          General Report
        </MDTypography> */}

        <Grid container spacing={3}>
          {/* Top Filter Box */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <form onSubmit={handleSearch}>
                  <Grid container spacing={3}>
                    {/* Area Dropdown */}
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
                            <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Panchayat Dropdown */}
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
                            <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Ward Dropdown */}
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
                            <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* From Date */}
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

                    {/* To Date */}
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

                    {/* Search Button */}
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
                    height: "400px", 
                    width: "100%", 
                    borderRadius: "12px", 
                    overflow: "hidden",
                    zIndex: 0 
                  }}
                >
                  <MapContainer 
                    center={[20.5937, 78.9629]} 
                    zoom={5} 
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[20.5937, 78.9629]}>
                      <Popup>
                        General Report Location.
                      </Popup>
                    </Marker>
                  </MapContainer>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default GeneralReport;