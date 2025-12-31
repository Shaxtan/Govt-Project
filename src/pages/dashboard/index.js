import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import ApiService from "services/ApiService";
import { useNavigate } from "react-router-dom";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import DevicesIcon from "@mui/icons-material/Devices";
import WifiIcon from "@mui/icons-material/Wifi";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import StopIcon from "@mui/icons-material/Stop";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

import MDBox from "../../../src/assets/components/MDBox";
import MDTypography from "../../../src/assets/components/MDTypography";
import MDButton from "../../../src/assets/components/MDButton";

import DashboardLayout from "../../assets/components/examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../assets/components/examples/Navbars/DashboardNavbar";
import Footer from "../../assets/components/examples/Footer";
import Projects from "./components/DashboardTable";
import Chatbot from "./Chatbot";
import AlertModal from "../Modals/Modal";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";

const getInitialAccountId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
    return user?.accountId || 1;
  } catch {
    return 1;
  }
};

const getUserType = () => {
  try {
    const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
    return user?.type || ""; // DIST, BLK, or PNCH
  } catch {
    return "";
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const projectsRef = useRef(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(getInitialAccountId());
  const [userRole, setUserRole] = useState(getUserType());

  const [dropdownData, setDropdownData] = useState({
    districts: [],
    blocks: [],
    panchayats: [],
  });

  const [vtsData, setVtsData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [summaryData, setSummaryData] = useState({
    total: 0,
    functional: 0,
    nonFunctional: 0,
    notInstalled: 0,
  });

  const [alertApiData, setAlertApiData] = useState({ summary: [], data: [] });
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [filterData, setFilterData] = useState({
    district: "",
    block: "",
    panchayat: "",
  });

  const handleOpenModal = (reportTitle) => {
    setSelectedReport(reportTitle);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedReport(null);
  };

  const fetchAccounts = () => {
    ApiService.getAccountDropdown((res) => {
      // Logic Fix: Ensure we are accessing the correct data path and property names
      if (res?.data?.resultCode === 1 && Array.isArray(res.data.data)) {
        const allAccounts = res.data.data;
        setAccounts(allAccounts);

        setDropdownData({
          districts: allAccounts.filter((item) => item.type === "DIST"),
          blocks: allAccounts.filter((item) => item.type === "BLK"),
          panchayats: allAccounts.filter((item) => item.type === "PNCH"),
        });
      }
    });
  };

  const fetchDashboardData = useCallback((accountId, isManual = false) => {
    if (isManual) setIsRefreshing(true);
    ApiService.getYesterdaySummary(accountId, (res) => {
      if (res?.data?.resultCode === 1 && res?.data?.data) {
        const apiData = res.data.data;
        setSummaryData({
          total: apiData.total || 0,
          functional: apiData.functional || 0,
          nonFunctional: apiData.nonFunctional || 0,
          notInstalled: apiData.notInstalled || 0,
        });
        setLastRefreshTime(Date.now());
      }
      if (isManual) setIsRefreshing(false);
    });
  }, []);

  const fetchAlertsData = useCallback((accountId) => {
    ApiService.getDbAlerts(accountId, (res) => {
      if (res?.data?.resultCode === 1 && res?.data?.data) {
        setAlertApiData(res.data.data);
      }
    });
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchDashboardData(selectedAccountId);
    fetchAlertsData(selectedAccountId);

    const intervalId = setInterval(() => {
      fetchDashboardData(selectedAccountId);
      fetchAlertsData(selectedAccountId);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [selectedAccountId, fetchDashboardData, fetchAlertsData]);

  const handleAccountChange = (event) => {
    setSelectedAccountId(event.target.value);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const targetAccountId =
      filterData.panchayat || filterData.block || filterData.district || selectedAccountId;
    console.log("Searching for Account ID:", targetAccountId);
    fetchDashboardData(targetAccountId);
    fetchAlertsData(targetAccountId);
  };

  const handleReportClick = async (reportTitle) => {
    if (reportTitle === "General Report") {
      navigate("/reports/general-report");
    } else if (reportTitle === "Non-Functional Scheme Report") {
      handleOpenModal(reportTitle);
      setTableLoading(true);
      try {
        const end = new Date().toISOString().slice(0, 19).replace("T", " ");
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const start = startDate.toISOString().slice(0, 19).replace("T", " ");

        const accIdForReport =
          filterData.panchayat || filterData.block || filterData.district || selectedAccountId;

        const reportData = await ApiService.getNonFunctionalReport(accIdForReport, start, end);
        setVtsData(reportData);
      } catch (error) {
        console.error("Failed to load report", error);
      } finally {
        setTableLoading(false);
      }
    } else if (reportTitle === "Review Report") {
      handleOpenModal(reportTitle);
    }
  };

  const handleCloseAlertModal = () => setAlertModalOpen(false);

  const filteredAlertData = useMemo(() => {
    if (!selectedAlertType) return alertApiData.data;
    return alertApiData.data.filter((alert) => alert.type === selectedAlertType);
  }, [alertApiData.data, selectedAlertType]);

  return (
    <DashboardLayout>
      <DashboardNavbar
        accounts={accounts}
        selectedAccountId={String(selectedAccountId)}
        handleAccountChange={handleAccountChange}
        onManualRefresh={() => {
          fetchDashboardData(selectedAccountId, true);
          fetchAlertsData(selectedAccountId);
        }}
        lastRefreshTime={lastRefreshTime}
        isRefreshing={isRefreshing}
      />

      <MDBox py={3} pt={1} pb={1} />

      <MDBox py={0}>
        {/* Alerts Section */}
        <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
          <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h6" fontWeight="medium">
              Alerts
            </MDTypography>
            <MDTypography variant="caption" color="text">
              {filteredAlertData?.length || 0} alerts
            </MDTypography>
          </MDBox>
          <Divider />
          <MDBox px={2} py={2} sx={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {filteredAlertData?.length > 0 ? (
              filteredAlertData.map((alert, idx) => (
                <Card
                  key={idx}
                  sx={{
                    minWidth: 260,
                    maxWidth: 260,
                    flexShrink: 0,
                    borderRadius: 2,
                    boxShadow: 2,
                    borderLeft:
                      alert.severity === "high"
                        ? "4px solid #f44336"
                        : alert.severity === "medium"
                        ? "4px solid #ff9800"
                        : "4px solid #4caf50",
                  }}
                >
                  <MDBox p={2}>
                    <MDTypography
                      variant="button"
                      fontWeight="medium"
                      textTransform="capitalize"
                      mb={0.5}
                      display="block"
                    >
                      {alert.type || "Alert"}
                    </MDTypography>
                    <MDTypography
                      variant="caption"
                      color="text"
                      display="block"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {alert.message || alert.description || "No description available."}
                    </MDTypography>
                    <MDBox
                      mt={1.5}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <MDTypography variant="caption" color="text">
                        {alert.time || alert.timestamp || ""}
                      </MDTypography>
                      <MDTypography
                        variant="caption"
                        fontWeight="medium"
                        color={
                          alert.severity === "high"
                            ? "error"
                            : alert.severity === "medium"
                            ? "warning"
                            : "success"
                        }
                      >
                        {alert.severity ? alert.severity.toUpperCase() : "NORMAL"}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </Card>
              ))
            ) : (
              <MDBox width="100%" display="flex" justifyContent="center" py={2}>
                <MDTypography variant="caption" color="text">
                  No alerts available.
                </MDTypography>
              </MDBox>
            )}
          </MDBox>
        </Card>

        {/* Updated Hierarchical Filters */}
        <Card sx={{ mb: 4, p: 2 }}>
          <MDBox p={2}>
            <Grid container spacing={3} alignItems="flex-end">
              <Grid item xs={12} md={3}>
                <MDBox mb={1} ml={0.5}>
                  <MDTypography variant="caption" fontWeight="bold">
                    SELECT DISTRICT
                  </MDTypography>
                </MDBox>
                <FormControl fullWidth variant="outlined" size="small">
                  <Select
                    name="district"
                    value={filterData.district}
                    onChange={handleFilterChange}
                    displayEmpty
                    disabled={userRole === "BLK" || userRole === "PNCH"}
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

              <Grid item xs={12} md={3}>
                <MDBox mb={1} ml={0.5}>
                  <MDTypography variant="caption" fontWeight="bold">
                    SELECT BLOCK
                  </MDTypography>
                </MDBox>
                <FormControl fullWidth variant="outlined" size="small">
                  <Select
                    name="block"
                    value={filterData.block}
                    onChange={handleFilterChange}
                    displayEmpty
                    disabled={userRole === "PNCH"}
                  >
                    <MenuItem value="" disabled>
                      Select Block
                    </MenuItem>
                    {dropdownData.blocks.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <MDBox mb={1} ml={0.5}>
                  <MDTypography variant="caption" fontWeight="bold">
                    SELECT PANCHAYAT
                  </MDTypography>
                </MDBox>
                <FormControl fullWidth variant="outlined" size="small">
                  <Select
                    name="panchayat"
                    value={filterData.panchayat}
                    onChange={handleFilterChange}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Panchayat
                    </MenuItem>
                    {dropdownData.panchayats.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <MDButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                >
                  Search
                </MDButton>
              </Grid>
            </Grid>
          </MDBox>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <MDBox p={2}>
                <MDTypography
                  variant="caption"
                  fontWeight="medium"
                  color="text"
                  textTransform="uppercase"
                >
                  Total IoT to Install
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" mt={1}>
                  {summaryData.total.toLocaleString()}
                </MDTypography>
                <MDTypography variant="caption" color="text" mt={0.5}>
                  Planned deployments
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, borderTop: "3px solid #4CAF50" }}>
              <MDBox p={2}>
                <MDTypography
                  variant="caption"
                  fontWeight="medium"
                  color="text"
                  textTransform="uppercase"
                >
                  Functional Devices
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" mt={1} color="success">
                  {summaryData.functional.toLocaleString()}
                </MDTypography>
                <MDTypography variant="caption" color="text" mt={0.5}>
                  Devices deployed on field
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, borderTop: "3px solid #2196F3" }}>
              <MDBox p={2}>
                <MDTypography
                  variant="caption"
                  fontWeight="medium"
                  color="text"
                  textTransform="uppercase"
                >
                  Total Non-Functional
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" mt={1} color="info">
                  {summaryData.nonFunctional.toLocaleString()}
                </MDTypography>
                <MDTypography variant="caption" color="text" mt={0.5}>
                  Currently reporting data
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, borderTop: "3px solid #F44336" }}>
              <MDBox p={2}>
                <MDTypography
                  variant="caption"
                  fontWeight="medium"
                  color="text"
                  textTransform="uppercase"
                >
                  Pending Installation
                </MDTypography>
                <MDTypography variant="h4" fontWeight="bold" mt={1} color="error">
                  {summaryData.notInstalled.toLocaleString()}
                </MDTypography>
                <MDTypography variant="caption" color="text" mt={0.5}>
                  Require attention
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>

        {/* Reports Section */}
        <Grid container spacing={3} mb={4}>
          {[
            { title: "General Report", desc: "View all standard device logs" },
            { title: "Review Report", desc: "Summary of maintenance checks" },
            { title: "Non-Functional Scheme Report", desc: "List of inactive schemes" },
          ].map((report, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <MDBox p={3} textAlign="center">
                  <MDBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    width="3rem"
                    height="3rem"
                    bgColor="info"
                    variant="gradient"
                    borderRadius="lg"
                    shadow="md"
                    mx="auto"
                    mb={2}
                  >
                    <AssignmentIcon fontSize="medium" sx={{ color: "#fff" }} />
                  </MDBox>
                  <MDTypography variant="h6" fontWeight="medium" textTransform="capitalize">
                    {report.title}
                  </MDTypography>
                  <MDTypography
                    variant="button"
                    color="text"
                    fontWeight="regular"
                    mb={2}
                    display="block"
                  >
                    {report.desc}
                  </MDTypography>
                  <Divider sx={{ mb: 2 }} />
                  <MDButton
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleReportClick(report.title)}
                  >
                    View Report
                  </MDButton>
                </MDBox>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Modal for Reports */}
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2, minHeight: "80vh" } }}
        >
          <DialogTitle
            sx={{
              m: 0,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <MDTypography variant="h5" fontWeight="medium">
              {selectedReport}
            </MDTypography>
            <IconButton
              onClick={handleCloseModal}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {tableLoading ? (
              <MDBox display="flex" justifyContent="center" p={5}>
                <MDTypography variant="h6">Loading Report Data...</MDTypography>
              </MDBox>
            ) : (
              <Projects accountId={selectedAccountId} reportData={vtsData} />
            )}
          </DialogContent>
        </Dialog>
      </MDBox>

      <Chatbot devices={devices} />
      <Footer />
      <AlertModal
        open={alertModalOpen}
        onClose={handleCloseAlertModal}
        title={selectedAlertType ? `${selectedAlertType} Alerts` : "All Alerts"}
        alertData={filteredAlertData}
      />
    </DashboardLayout>
  );
}

export default Dashboard;
